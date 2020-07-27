const express = require("express");
const app = express();
exports.app = app;
const cookieSession = require("cookie-session");
const csurf = require("csurf");

const {
    insertUsers,
    getPassword,
    isUserSigned,
    insertSignature,
    insertUserProfiles,
    getSignersList,
    getSignersListbyCity,
    deleteSignature,
    getProfile,
    updateUserWPass,
    updateUserWithoutPass,
    updateUserProfile,
} = require("./db.js");
const { hash, compare } = require("./bcrypt.js");

const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: `Super petition is awesome.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(csurf());

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
}); // remember to put hidden input csrf for every form!!!!

app.use(express.static(__dirname + "/public"));

app.use((req, res, next) => {
    const date = new Date();
    console.log(`
------------------------------------------------
    user: ${req.session.userId}
    method: ${req.method} 
    url: ${req.url}
    at: ${date.toUTCString()}
------------------------------------------------
    `);
    next();
});

app.use((req, res, next) => {
    if (!req.session.userId && req.url != "/login" && req.url != "/register") {
        res.redirect("/register");
    } else {
        next();
    }
});

app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    if (req.session.userId) {
        res.redirect("petition");
    } else {
        res.render("register");
    }
});

app.post("/register", (req, res) => {
    let userPass = req.body.password;
    if (userPass == "") {
        userPass = null;
    }
    let userFirst = req.body.firstname;
    if (userFirst == "") {
        userFirst = null;
    }
    let userLast = req.body.lastname;
    if (userLast == "") {
        userLast = null;
    }
    let userEmail = req.body.email;
    if (userEmail == "") {
        userEmail = null;
    }

    hash(userPass)
        .then((hashedUserPass) => {
            insertUsers(
                req.body.firstname,
                req.body.lastname,
                req.body.email,
                hashedUserPass
            )
                .then((result) => {
                    let userId = result.rows[0].id;
                    req.session.userId = userId;
                    updateUserProfile(userId, null, null, null, "")
                        .then((result) => {
                            console.log(result);
                            res.redirect("profile");
                        })
                        .catch((err) => {
                            console.log(
                                "error in insertUserProfiles /register",
                                err
                            );
                            res.render("register", {
                                error: true,
                            });
                        });
                })
                .catch((err) => {
                    console.log("error in insertUsers /register", err);
                    res.render("register", {
                        error: true,
                    });
                });
        })
        .catch((err) => {
            console.log("error in hash /register", err);
            res.render("register", {
                error: true,
            });
        });
});

app.get("/profile", (req, res) => {
    if (req.session.userId) {
        res.render("profile");
    } else {
        res.redirect("register");
    }
});

app.post("/profile", (req, res) => {
    let userId = req.session.userId;
    let userAge = req.body.age;
    if (userAge == "") {
        userAge = null;
    }
    let userCity = req.body.city;
    if (userCity == "") {
        userCity = null;
    } else {
        userCity = userCity.toUpperCase();
    }
    let userProfession = req.body.profession;
    if (userProfession == "") {
        userProfession = null;
    }
    let userUrl = req.body.userUrl;
    if (userUrl.indexOf("www") == 0) {
        userUrl = `http://${userUrl}`;
    }
    updateUserProfile(userId, userAge, userCity, userProfession, userUrl)
        .then((result) => {
            res.redirect("petition");
        })
        .catch((err) => {
            console.log("error in updateUserProfile /profile", err);
            res.redirect("profileedit");
        });
});

app.get("/profileedit", (req, res) => {
    if (req.session.userId) {
        getProfile(req.session.userId)
            .then((result) => {
                let userProfile = {};
                if (req.session.profileUpdated) {
                    userProfile.updated = true;
                    req.session.profileUpdated = false;
                }

                for (let prop in result.rows[0]) {
                    userProfile[prop] = result.rows[0][prop];
                }
                res.render("profileedit", {
                    userProfile: userProfile,
                });
            })
            .catch((err) => {
                console.log("error in getProfile /profileedit", err);
                res.render("profileedit", {
                    error: true,
                });
            });
    } else {
        res.redirect("/register");
    }
});

app.post("/profileedit", (req, res) => {
    let userId = req.session.userId;
    let userFirst = req.body.first;
    if (userFirst == "") {
        userFirst = null;
    }
    let userLast = req.body.last;
    if (userLast == "") {
        userLast = null;
    }
    let userEmail = req.body.email;
    if (userEmail == "") {
        userEmail = null;
    }
    let userPass = req.body.password;
    if (userPass == "") {
        userPass = null;
    }
    let userAge = req.body.age;
    if (userAge == "") {
        userAge = null;
    }
    let userCity = req.body.city;
    if (userCity == "") {
        userCity = null;
    } else {
        userCity = userCity.toUpperCase();
    }
    let userProfession = req.body.profession;
    if (userProfession == "") {
        userProfession = null;
    }
    let userUrl = req.body.userUrl;
    if (userUrl.indexOf("www") == 0) {
        userUrl = `http://${userUrl}`;
    }
    if (userPass != null) {
        hash(userPass)
            .then((hashedUserPass) => {
                updateUserWPass(
                    userId,
                    userFirst,
                    userLast,
                    userEmail,
                    hashedUserPass
                )
                    .then(() => {
                        updateUserProfile(
                            userId,
                            userAge,
                            userCity,
                            userProfession,
                            userUrl
                        )
                            .then(() => {
                                req.session.profileUpdated = true;
                                res.redirect("/profileedit");
                            })
                            .catch((err) => {
                                console.log(
                                    "error in updateUserProfile with Pass /profileedit",
                                    err
                                );

                                res.render("/profileedit", {
                                    error: true,
                                });
                            });
                    })
                    .catch((err) => {
                        console.log(
                            "error in updateUserWPass /profileedit",
                            err
                        );
                        res.render("profileedit", {
                            error: true,
                        });
                    });
            })
            .catch((err) => {
                console.log("error in hash /profileedit", err);
                res.render("profileedit", {
                    error: true,
                });
            });
    } else {
        updateUserWithoutPass(userId, userFirst, userLast, userEmail)
            .then(() => {
                updateUserProfile(
                    userId,
                    userAge,
                    userCity,
                    userProfession,
                    userUrl
                )
                    .then(() => {
                        req.session.profileUpdated = true;
                        res.redirect("/profileedit");
                    })
                    .catch((err) => {
                        console.log(
                            "error in updateUserProfile without Pass /profileedit",
                            err
                        );
                        res.render("/profileedit", {
                            error: true,
                        });
                    });
            })
            .catch((err) => {
                console.log("error in updateUserWithoutPass /profileedit", err);
                res.render("profileedit", {
                    error: true,
                });
            });
    }
});

app.get("/login", (req, res) => {
    if (req.session.userId) {
        res.redirect("petition");
    } else {
        res.render("login");
    }
});

app.post("/login", (req, res) => {
    let userPass = req.body.password;
    let userEmail = req.body.email;
    getPassword(userEmail)
        .then((result) => {
            compare(userPass, result.rows[0].password)
                .then((match) => {
                    if (match) {
                        let userId = result.rows[0].id;
                        req.session.userId = userId;
                        isUserSigned(req.session.userId)
                            .then((result) => {
                                if (result.rowCount == 0) {
                                    res.redirect("petition");
                                } else {
                                    res.redirect("thanks");
                                }
                            })
                            .catch((err) => {
                                console.log(
                                    "error in isUserSigned /login",
                                    err
                                );
                                res.render("login", {
                                    error: true,
                                });
                            });
                    } else {
                        res.render("login", {
                            error: true,
                        });
                    }
                })
                .catch((err) => {
                    console.log("error in compare /login", err);
                    res.render("login", {
                        error: true,
                    });
                });
        })
        .catch((err) => {
            console.log("error in getPassword /login", err);
            res.render("login", {
                error: true,
            });
        });
});

app.get("/petition", (req, res) => {
    if (req.session.userId) {
        isUserSigned(req.session.userId)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.render("petition");
                } else {
                    res.redirect("thanks");
                }
            })
            .catch((err) => {
                console.log("error in isUserSigned /petition", err);
                res.render("petition", {
                    error: true,
                });
            });
    } else {
        res.redirect("register");
    }
});

app.post("/petition", (req, res) => {
    if (req.session.userId && req.session.signatureId) {
        res.redirect("thanks");
    } else {
        insertSignature(req.body.signature, req.session.userId)
            .then((result) => {
                let id = result.rows[0].id;
                req.session.signatureId = id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("error: ", err);
                res.render("petition", {
                    error: true,
                });
            });
    }
});

app.get("/thanks", (req, res) => {
    if (req.session.userId) {
        isUserSigned(req.session.userId)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.redirect("petition");
                } else {
                    let crewNumber = null;
                    let sign = result.rows[0].signature;
                    getSignersList()
                        .then((result) => {
                            // console.log(result.rows.length);
                            crewNumber = result.rows.length;
                            res.render("thanks", {
                                signature: [sign],
                                crewNumber: crewNumber,
                            });
                        })
                        .catch((err) => {
                            console.log("error in getSignersList /thanks", err);
                            res.render("thanks", {
                                error: true,
                            });
                        });
                }
            })
            .catch((err) => {
                console.log("error in isUserSigned /thanks", err);
                res.redirect("petition");
            });
    } else {
        res.redirect("register");
    }
});

app.post("/thanks", (req, res) => {
    deleteSignature(req.session.userId)
        .then((result) => {
            req.session.signatureId = null;
            res.redirect("petition");
        })
        .catch((err) => {
            console.log("error in deleteSignature /thanks", err);
            res.render("thanks", {
                error: true,
            });
        });
});

app.get("/signers", (req, res) => {
    if (req.session.userId) {
        isUserSigned(req.session.userId)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.redirect("petition");
                } else {
                    let signersList = [];
                    getSignersList()
                        .then((result) => {
                            for (let i = 0; i < result.rows.length; i++) {
                                if (
                                    !result.rows[i].url ||
                                    result.rows[i].url.indexOf("http") != 0 ||
                                    result.rows[i].url.indexOf("https") != 0
                                ) {
                                    result.rows[i].url = null;
                                }
                                signersList.push(result.rows[i]);
                            }
                            // console.log(signersList);
                            let crewNumber = result.rows.length;
                            res.render("signers", {
                                signersList,
                                crewNumber: crewNumber,
                            });
                        })
                        .catch((err) => {
                            console.log(
                                "error in getSignersList /signers",
                                err
                            );
                            res.render("signers", {
                                error: true,
                            });
                        });
                }
            })
            .catch((err) => {
                console.log("error in isUserSigned /signers", err);
                res.render("signers", {
                    error: true,
                });
            });
    } else {
        res.redirect("register");
    }
});

app.get("/signers:city", (req, res) => {
    let city = req.params.city;
    city = city.slice(1);
    if (req.session.userId) {
        isUserSigned(req.session.userId)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.redirect("petition");
                } else {
                    let signersList = [];
                    getSignersListbyCity(city)
                        .then((result) => {
                            for (let i = 0; i < result.rows.length; i++) {
                                if (
                                    result.rows[i].url.indexOf("http") != 0 ||
                                    result.rows[i].url.indexOf("https") != 0
                                ) {
                                    result.rows[i].url = null;
                                }
                                signersList.push(result.rows[i]);
                            }
                            res.render("signerscity", {
                                signersList,
                                crewCity: signersList[0].city,
                                crewNumber: signersList.length,
                            });
                        })
                        .catch((err) => {
                            console.log(
                                "error in getSignersListbyCity /signers:city",
                                err
                            );
                            res.render("signerscity", {
                                error: true,
                            });
                        });
                }
            })
            .catch((err) => {
                console.log("error in isUserSigned /signers:city", err);
                res.render("signers", {
                    layout: "signers",
                    error: true,
                });
            });
    } else {
        res.redirect("register");
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("login");
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => {
        console.log("server listening!");
    });
}
