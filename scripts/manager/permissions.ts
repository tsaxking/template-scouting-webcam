import { backToMain } from '../manager.ts';
import { repeatPrompt, select } from '../prompt.ts';
import { selectRole } from './roles.ts';
import { Permission } from '../../shared/permissions.ts';
import Role from '../../server/structure/roles.ts';
import { DB } from '../../server/utilities/databases.ts';
import { saveFile } from '../../server/utilities/files.ts';
import { attemptAsync } from '../../shared/check.ts';

const createPermission = async (perm: Permission, description: string) => {
    return attemptAsync(async () => {
        // will not do anything if the permission already exists
        await DB.unsafe.run(
            `
            INSERT INTO Permissions (permission, description)
            VALUES (?, ?)

            ON CONFLICT(permission) DO NOTHING
        `,
            perm,
            description,
        );

        const [permissions, roles] = await Promise.all([
            Role.getAllPermissions(),
            Role.all(),
        ]);

        const comment =
            '// This file is automatically generated by the permissions manager, please do not edit\n\n';
        const permTS = 'export type Permission = ' +
            permissions.map((p) => `'${p}'`).join(' | ') +
            ';';
        const roleTS = 'export type RoleName = ' +
            roles.map((r) => `'${r.name}'`).join(' | ') +
            ';';

        const res = await saveFile(
            'shared/permissions.ts',
            comment + permTS + '\n' + roleTS,
        );
        if (res.isOk()) {
            console.log('Permissions file updated');
        } else {
            throw new Error('Failed to update permissions file ' + res.error);
        }
    });
};

export const addPermissions = async () => {
    const roleRes = await selectRole('Select a role to add permissions to');

    if (roleRes.isOk()) {
        const role = roleRes.value;

        const allPerms = await Role.getAllPermissions();
        let perm = (await select<Permission>('Select a permission to add', [
            ...allPerms.map((p) => ({
                name: p,
                value: p,
            })),
            {
                name: '[New]',
                value: '$$New$$' as unknown as Permission,
            },
        ])) as Permission | '$$New$$';

        const perms = await role.getPermissions();

        if (perm === '$$New$$') {
            perm = repeatPrompt(
                'Enter the permission name',
                undefined,
                (data) =>
                    !perms.some((p) => p.permission === data) &&
                    !allPerms.some((p) => p === data),
                false,
            ) as unknown as Permission;
            const description = repeatPrompt(
                'Enter the permission description',
            );
            createPermission(perm, description);
        }

        role.addPermission(perm);
        backToMain(`Permission ${perm} added to role ${role.name}`);
    } else {
        backToMain('No roles to add permissions to');
    }
};

export const removePermissions = async () => {
    const roleRes = await selectRole(
        'Select a role to remove permissions from',
    );

    if (roleRes.isOk()) {
        const role = roleRes.value;
        const perms = await role.getPermissions();
        if (!perms.length) {
            backToMain(`Role ${role.name} has no permissions`);
        } else {
            const perm = await select(
                'Select a permission to remove',
                perms.map((p) => ({
                    name: p.permission,
                    value: p,
                })),
            );

            if (perm) {
                role.removePermission(perm.permission);
                backToMain(`Permission ${perm.permission} removed from role ${role.name}`);
            } else {
                backToMain('No permissions to remove');
            }
        }
    } else {
        backToMain('No roles to remove permissions from');
    }
};

export const permissions = [
    {
        icon: '📝',
        value: addPermissions,
    },
    {
        icon: '🗑️',
        value: removePermissions,
    },
];
