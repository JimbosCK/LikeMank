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
const path = require("path")

const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json())



// Routs

app.get("/", (req, res) => {
    res.render("index")
})

app.get('/code/:promolink', (req, res) => {
    const promoLink = req.params.promolink;

    db.query(
        'SELECT * FROM promocodes INNER JOIN codes on codes.ID = promocodes.CodeID where link = ?',
        [promoLink],
        async (error, ress) => {
            if (error) {
                console.log(error)
                res.render('code', { promocode: "Database Error" });
            } else {
                if (ress != undefined && ress[0] != undefined) { // has rows
                    dbRow = ress[0]

                    if (dbRow.Active) {
                        console.log(ress)
                        const dbpromoCode = ress[0].Number;
                        res.render('code', { promocode: dbpromoCode });
                    } else {
                        res.render('code', { promocode: "", backError: "Inactive Promo" });
                    }
                } else {
                    res.render('code', { promocode: "", backError: "Invalid Link" });
                }
            }
        })
});




app.listen(5000, () => {
    console.log("server started on port 5000")
})