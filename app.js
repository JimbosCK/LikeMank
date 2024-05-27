const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv')

const app = express();

dotenv.config({ path: './.env' })

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})

app.set('view engine', 'hbs')

// other imports
const path = require("path");
const { randomUUID } = require('crypto');

const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json())



// Routs

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/generateCode", (req, res) => {
    res.render("generateCode", { promocode: "0000-0000-0000-0000" })
})


app.post("/promocode/generate", (req, res) => {
    const promoCodeID = randomUUID();
    const promoLink = randomUUID();
    const expDate = setExpDate(1, 0, 0);

    db.query(
        'INSERT INTO promocodes (ID, Number, ExpireDate, Active) VALUES (?, ?, ?, ?)',
        [promoCodeID, randomUUID(), expDate, 1],
        async (error, ressc) => {

            if (error) {
                console.log(error)
                res.render('promocode', { promocode: "Database Error while creating promotion code ERR:PG1" });
            }
            db.query(
                'INSERT INTO promotions(ID, link, CodeID, UnlockKey) VALUES (?, ?, ?, ?)',
                [randomUUID(), promoLink, promoCodeID, randomUUID()],
                async (error, ressp) => {

                    if (error) {
                        console.log(error)
                        res.render('promocode', { promocode: "Database Error while creating promotion. ERR:PG2" });
                    }
                    res.render("generateCode", { promocode: promoLink })
                })
        })
})


app.get('/promocode/:promolink', (req, res) => {
    const promoLink = req.params.promolink;

    db.query(
        'SELECT * FROM promotions INNER JOIN promocodes on promocodes.ID = promotions.CodeID where link = ?',
        [promoLink],
        async (error, ress) => {
            if (error) {
                console.log(error)
                res.render('promocode', { promocode: "Database Error" });
            } else {
                if (ress != undefined && ress[0] != undefined) { // has rows
                    dbRow = ress[0]

                    if (dbRow.Active) {
                        const dbpromoCode = ress[0].Number;
                        res.render('promocode', { promocode: dbpromoCode });
                    } else {
                        res.render('promocode', { promocode: "", backError: "Inactive Promo" });
                    }
                } else {
                    res.render('promocode', { promocode: "", backError: "Invalid Link" });
                }
            }
        })
});




app.listen(5000, () => {
    console.log("server started on port 5000")
})

function setExpDate(expYears, expMonths, expDays) {
    var expDate = new Date();

    expDate.setFullYear(expDate.getFullYear() + expYears);
    expDate.setMonth(expDate.getMonth() + expMonths);
    expDate.setDate(expDate.getDate() + expDays);
    return expDate;
}
