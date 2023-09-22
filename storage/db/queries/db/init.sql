CREATE TABLE IF NOT EXISTS Accounts (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    key TEXT NOT NULL,
    salt TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordChange TEXT,
    picture TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    verification TEXT,
    emailChange TEXT,
    passwordChangeDate TEXT,
    phoneNumber TEXT,
    created TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS Members (
    id INTEGER PRIMARY KEY,
    title TEXT,
    status TEXT,
    bio TEXT,
    resume TEXT,
    board INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (id) REFERENCES Accounts(id)
);





CREATE TABLE IF NOT EXISTS Roles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rank INTEGER NOT NULL
);




CREATE TABLE IF NOT EXISTS AccountRoles (
    accountId INTEGER NOT NULL,
    roleId INTEGER NOT NULL,
    FOREIGN KEY (accountId) REFERENCES Accounts(id),
    FOREIGN KEY (roleId) REFERENCES Roles(id)
);



CREATE TABLE IF NOT EXISTS Permissions (
    roleId INTEGER NOT NULL,
    permission TEXT NOT NULL,
    FOREIGN KEY (roleId) REFERENCES Roles(id)
);


CREATE TABLE IF NOT EXISTS Version (
    version INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS Sessions (
    id TEXT PRIMARY KEY,
    accountId INTEGER,
    ip TEXT,
    userAgent TEXT,
    latestActivity TEXT,
    requests INTEGER NOT NULL DEFAULT 0,
    created INTEGER NOT NULL,
    prevUrl TEXT
);




INSERT INTO Version (
    version
) VALUES (
    1
);