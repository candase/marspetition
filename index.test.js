const supertest = require("supertest");
const { app } = require("./index.js");
const cookieSession = require("cookie-session");

jest.mock("./db");

const db = require("./db");

// db.isUserSigned.mockResolvedValue({
//     rows: [
//         {
//             signature: 10,
//         },
//     ],
// });

// db.isUserSigned.mockResolvedValue({
//     test: 0,
// });

test("rerouting from /petition to /register if user is logged out", () => {
    return supertest(app)
        .get("/petition")
        .expect(302)
        .expect("Location", "/register");
});

test("rerouting from /register to /petition if user is logged in", () => {
    cookieSession.mockSessionOnce({
        userId: 2,
    });
    return supertest(app)
        .get("/register")
        .expect(302)
        .expect("Location", "petition");
});

test("rerouting from /login to /petition if user is logged in", () => {
    cookieSession.mockSessionOnce({
        userId: 2,
    });
    return supertest(app)
        .get("/login")
        .expect(302)
        .expect("Location", "petition");
});

db.isUserSigned.mockResolvedValue({
    rowCount: 1,
    rows: [
        {
            signature: 10,
        },
    ],
});

test("rerouting from /petition to /thanks if user is logged in and signed the petition", () => {
    cookieSession.mockSessionOnce({
        userId: 2,
        // signatureId: 2,
    });
    return supertest(app)
        .get("/petition")
        .expect(302)
        .expect("Location", "thanks");
});

db.isUserSigned.mockResolvedValue({
    rows: [
        {
            signature: 10,
        },
    ],
});

test("rerouting from /petition POST to /thanks if user is logged in and signed the petition", () => {
    cookieSession.mockSessionOnce({
        userId: 2,
        signatureId: 2,
    });

    return supertest(app)
        .post("/petition")
        .expect(302)
        .expect("Location", "thanks");
});

db.isUserSigned.mockResolvedValue({
    rowCount: 0,
});

test("rerouting from /thanks to /petition if user is logged in and not signed the petition", () => {
    cookieSession.mockSessionOnce({
        userId: 2,
    });
    return supertest(app)
        .get("/thanks")
        .expect(302)
        .expect("Location", "petition");
});

db.isUserSigned.mockResolvedValue({
    rowCount: 0,
});

test("rerouting from /signers to /petition if user is logged in and not signed the petition", () => {
    cookieSession.mockSessionOnce({
        userId: 2,
    });
    return supertest(app)
        .get("/signers")
        .expect(302)
        .expect("Location", "petition");
});
