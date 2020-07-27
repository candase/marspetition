const spicedPg = require("spiced-pg");
const bcrypt = require("./bcrypt");

let db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbUser, dbPass } = require("./secrets.json");
    db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);
}

// db.query(
//     "INSERT INTO signature (first, last, signature) VALUES ('Candas', 'Erdener', 'sign')"
// );

// db.query("SELECT * FROM signature")
//     .then((result) => {
//         console.log("result: ", result);
//     })
//     .catch((err) => {
//         console.log("error: ", err);
//     });

exports.insertUsers = (firstname, lastname, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING ID`,
        [firstname, lastname, email, password]
    );
};

exports.getPassword = (email) => {
    return db.query("SELECT password, id FROM users WHERE email = $1", [email]);
};

exports.isUserSigned = (userid) => {
    return db.query(`SELECT signature FROM signature WHERE user_id = $1`, [
        userid,
    ]);
};

exports.signatureIdNumber = (id) => {
    return db.query("SELECT signature FROM signature WHERE id = $1", [id]);
};

exports.insertSignature = (signature, userid) => {
    return db.query(
        "INSERT INTO signature (signature, user_id) VALUES($1, $2) RETURNING ID",
        [signature, userid]
    );
};

exports.insertUserProfiles = (age, city, profession, url, id) => {
    return db.query(
        `
    INSERT INTO user_profiles (age, city, profession, url, user_id) VALUES($1, $2, $3, $4, $5) RETURNING *
    `,
        [age, city, profession, url, id]
    );
};

exports.getSignersList = () => {
    return db.query(
        `
    SELECT signature.user_id, users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.profession, user_profiles.url
    FROM signature 
    JOIN users
    ON signature.user_id = users.id
    JOIN user_profiles 
    ON signature.user_id = user_profiles.user_id`
    );
};

exports.getSignersListbyCity = (city) => {
    return db.query(
        `
    SELECT signature.user_id, users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.profession, user_profiles.url
    FROM signature
    JOIN users
    ON signature.user_id = users.id
    JOIN user_profiles
    ON signature.user_id = user_profiles.user_id WHERE user_profiles.city = $1;
    `,
        [city]
    );
};

exports.deleteSignature = (id) => {
    return db.query(
        `
    DELETE FROM signature WHERE user_id = $1;
    `,
        [id]
    );
};

exports.getProfile = (id) => {
    return db.query(
        `
    SELECT users.id, users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.profession, user_profiles.url
    FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE users.id = $1;
    `,
        [id]
    );
};

exports.updateUserWPass = (id, first, last, email, pass) => {
    return db.query(
        `
    UPDATE users
    SET first = $2, last = $3, email = $4, password = $5
    WHERE users.id = $1 
    `,
        [id, first, last, email, pass]
    );
};

exports.updateUserWithoutPass = (id, first, last, email) => {
    return db.query(
        `
    UPDATE users
    SET first = $2, last = $3, email = $4
    WHERE users.id = $1 
    `,
        [id, first, last, email]
    );
};

exports.updateUserProfile = (id, age, city, profession, url) => {
    return db.query(
        `
    INSERT INTO user_profiles (age, city, profession, url, user_id)
    VALUES ($2, $3, $4, $5, $1)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $2, city = $3, profession = $4, url = $5 RETURNING *
    `,
        [id, age, city, profession, url]
    );
};
