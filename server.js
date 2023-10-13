import session from "cookie-session"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import express from "express"
import mysql from "mysql"
import cors from "cors"

const app = express ()
app.use(cors({
    origin: ['https://taxicle-app.vercel.app'] , // Specify the allowed origin (your frontend app)
    methods: ["POST", "GET"],
    credentials: true, 
}))
app.use(express.json())
app.use(cookieParser());
app.use(bodyParser.json())
app.use(session({
    name : 'app.sid',
    secret: "1234567890QWERTY",
    resave: false,
    saveUninitialized: false,
    cookie:
    {
        secure:false,
        maxAge:1000 * 60 * 60 * 24
    }
}));
const db = mysql.createConnection({
    host: "bi49k4q5htgxhwitf92n-mysql.services.clever-cloud.com",
    user: "uqlt5eesvbqfue34",
    password: "yf0DYq6eOC8e6nXffzfK",
    database: "bi49k4q5htgxhwitf92n"
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

db.connect(function(err) {  
    if (err) throw err;  
    console.log("Connected!");  
  });  

  app.get('/admin-user',(req, res)=> {
   const sql = "Select * from users";
   db.query(sql,(err,data) =>{
    if(err)  return res.json("error")
    const fareSql = "Select * from fare"
    db.query(fareSql,(err,faredata) =>{
    if(err)  return res.json("error")   
        return res.json({data: data, fare:faredata})
    })
   })
})

app.get('/admin',(req, res)=> {
    if(req.session.admin) {
        return res.json({valid: true, user: req.session.admin})
    }else{
        return res.json({valid:false})
    }
})


app.post('/admin-login',(req, res)=> {
    const sql ="SELECT * From admin WHERE (`adminUser` = ? AND `adminPassword` = ?) OR (`adminEmail` = ? AND `adminPassword` = ?)";
    db.query(sql,[req.body.admin, req.body.password, req.body.admin, req.body.password], (err, data) => {
        if(err) {
            return res.json({message:"error"})
        }
        if(data.length > 0 ){
            req.session.admin = data[0].adminEmail;

            return res.json({Login:true, user: req.session.user});
        }else{
            const sqlCheckEmail ="SELECT * From users WHERE `adminUser` = ? OR `adminEmail` = ?";
            db.query(sqlCheckEmail,[req.body.admin, req.body.admin ], (err, data) => {
                if(err) {
                    return res.json({message:"error"})
                }
                if(data.length > 0 ){
                    return res.json({message:"Only Authorized Person Can Enter"});
                }else{
                    return res.json({message:"Only Authorized Person Can Enter"});
                }
            })
        }
    })
})

app.get('/admin-logout', (req, res) => { 

    delete req.session.admin
    return res.json({Status:"Success"})
})

app.post('/admin-update',(req, res) =>{
    const sql = "UPDATE fare SET `MinimumFare`= ?, `Discount`= ?, `Exceeding` = ?";
    console.log(req.body.MinimumFare, req.body.Discount, req.body.Exceeding)

    db.query(sql,[req.body.MinimumFare, req.body.Discount, req.body.Exceeding],(err,data) =>{ 
        if(err)  return res.json("error") 
        return res.json("Success")
    })
})

app.get('/',(req, res)=> {
    console.log(req.session.user)
    if(req.session.user) {
    const fareSql = "Select * from fare"
    db.query(fareSql,(err,faredata) =>{
    if(err)  return res.json("error")   
    const sql = "Select UserType from users WHERE `Email` = ?"
        db.query(sql,[req.session.user],(err,data) =>{
        return res.json({ fare:faredata,data: data[0].UserType, valid: true, user: req.session.user})
        })
    })
    }else{
        return res.json({valid: false})
    }
})

app.get('/user', (req, res) => {
    const sql = "SELECT * FROM users WHERE `Email` = ?"
    const useremail = req.session.user
    db.query(sql,[useremail], (err, data) => { 
        if(err) {
            return res.json("error")
        }
        if(data.length > 0 ){
        return res.json({FirstName: data[0].FirstName, LastName: data[0].LastName, Result: true});
        }
    })
})

app.post('/travel', (req, res) =>{
    const values = [
        req.session.user,
        req.body.UserPlace,
        req.body.UserAddress,
        req.body.UserRoutePlace,
        req.body.UserRouteAddress,
        req.body.PlateNumber,
        req.body.Distance,
        req.body.Duration,
        req.body.NumberOfPassenger,
        req.body.Fare,
    ]  
    const sql ="INSERT INTO travelhistory (`Email`,`UserPlace`,`UserAddress`,`UserRoutePlace`,`UserRouteAddress`,`PlateNum`,`Distance`,`Duration`,`NumberOfPassenger`,`Fare`) VALUES (?)";
    db.query(sql,[values], (err, data) => {
        if(err) {
            return res.json("eerror")
        }
        return res.json({Status:"Success"});
    })
})
    app.get('/history', (req, res) => {
    const sqlTraverse = "Select * from travelhistory WHERE `Email` = ?"
    db.query(sqlTraverse,[req.session.user], (err, Traveldata) => {

        return res.json( Traveldata);
    })
})
app.post('/register', (req, res) => {
    const sqlCheck = "SELECT * FROM users WHERE `Email` = ? OR `PhoneNumber` = ?";
    db.query(sqlCheck,[req.body.email, req.body.PhoneNumber], (err, data) => {
        const values = [
            req.body.FirstName,
            req.body.LastName,
            req.body.PhoneNumber,
            req.body.email,
            req.body.confirmPassword,
            req.body.UserType,
            req.body.plateNum,
            req.body.LicenseNum,
        ]  
        if(err) {
            return res.json("error")
        }
        if(data.length > 0 ){
            return res.json("This Email/Cellphne Number has been used!");
        }else{
            const sql ="INSERT INTO users (`FirstName`,`LastName`,`PhoneNumber`,`Email`,`Password`,`UserType`,`PlateNum`,`LicenseNum`) VALUES (?)";

            db.query(sql,[values], (err, data) => {
                if(err) {
                    return res.json("eerror")
                }
                return res.json("success");
            })
        }       
    })
})

app.post('/login', (req, res) => {

    const sql ="SELECT * From users WHERE `Email` = ? AND `Password` = ?";
    db.query(sql,[req.body.email, req.body.password], (err, data) => {
        if(err) {
            return res.json({message:"error"})
        }
        if(data.length > 0 ){
            req.session.user = data[0].Email;
            console.log( req.session.user )
            return res.json({Login:true, user: req.session.user});
        }else{
            const sqlCheckEmail ="SELECT * From users WHERE `Email` = ?";
            db.query(sqlCheckEmail,[req.body.email], (err, data) => {
                if(err) {
                    return res.json({message:"error"})
                }
                if(data.length > 0 ){
                    return res.json({message:"Your Email/Password is Incorrect!"});
                }else{
                    return res.json({message:"Email not Found! Try to Sign Up"});
                }
            })
        }
    })
})

app.get('/logout', (req, res) => { 

    delete req.session.user
    
    return res.json({Status:"Success"})
})

app.post('/forgot-password/:iv', (req, res) => {
    const sql ="SELECT * From users WHERE `Email` = ?";
    db.query(sql,[req.body.email], (err, data) => {
        if(err) {
            return res.json("error")
        }
        if(data.length > 0 ){
            
            const updateRec = "UPDATE users SET `onRecovery`= 1, `iv`= ? WHERE `Email` = ?";
            db.query(updateRec,[req.params.iv, req.body.email], (err, data) => {
            return res.json("success");
            })
        }else{
            return res.json("Email not Found!"); 
        }
    })
})


app.post('/reset-password/:iv/:password', (req, res) => {

    const sql ="SELECT * From users WHERE `iv` = ? AND `onRecovery` = 1";
    db.query(sql,[req.params.iv], (err, data) => {
        if(err) {
            return res.json("error")
        }
        if(data.length > 0 ){
            const updateRec = "UPDATE users SET `onRecovery`= 0,  `Password` = ?  WHERE `iv` = ?";
            db.query(updateRec,[req.params.password, req.params.iv], (err, data) => {
                if(err) {
                    return res.json("error")
                }
                return res.json("Success");
            })
        }else{
            return res.json(req.params.iv); 
        }
    })
})

app.post('/mapstyle/:mapstyle/:user', (req, res) => {
    const sql ="SELECT * FROM style WHERE `userEmail` = ?";
    const userEmail = req.params.user;
    db.query(sql,[userEmail], (err, Resdata) => {
        if(err) {
            return res.json("error")
        }
        if(Resdata.length > 0 ){
            const updateRec = "UPDATE style SET `mapStyle`= ? WHERE `userEmail` = ?";
            db.query(updateRec,[req.params.mapstyle , userEmail], (err, data) => {
                if(err) {
                    return res.json("Error")
                }
                return res.json({style: Resdata[0].mapStyle});
            })
        }else{
            return res.json("walang record bata"); 
        }
    })
})

app.get('/mapstyle', (req, res) => {
    const sql ="SELECT * FROM style WHERE `userEmail` = ?";
    const userEmail = req.session.user;
    db.query(sql,[userEmail], (err, data) => {
        if(err) {
            return res.json("error")
        }
        if(data.length > 0 ){
            return res.json({style: data[0].mapStyle});
        }else{
            return res.json("walang record bata"); 
        }
    })
})

app.post('/userupdate/:user', (req, res) => {
    const sql ="SELECT * FROM users WHERE `Email` = ?";
    const userEmail = req.params.user;
    db.query(sql,[userEmail], (err, udata) => {
        if(err) {
            return res.json("error")
        }
        if(udata.length > 0 ){


            if(req.body.confirmPassword) {
            const updateRec = "UPDATE users SET `FirstName`= ?, `LastName` = ?, `PhoneNumber` = ?, `Password` = ? WHERE `Email` = ?";
            db.query(updateRec,[req.body.FirstName ,req.body.LastName ,req.body.PhoneNumber ,req.body.confirmPassword ,userEmail], (err, data) => {
                if(err) {
                    return res.json("error")
                }
                    return res.json("Success")
            })
            }else{
            const updateRec = "UPDATE users SET `FirstName`= ?, `LastName` = ?, `PhoneNumber` = ? WHERE `Email` = ?";
            db.query(updateRec,[req.body.FirstName ,req.body.LastName,req.body.PhoneNumber,userEmail], (err, data) => {
                if(err) {
                    return res.json("error")
                }
                    return res.json("Success")
            })
        }
        }else{
            return res.json("walang record bata"); 
        }
    })
})


app.get('/fetchdata/:user', (req, res) => {
    const sql ="SELECT * FROM users WHERE `Email` = ?";
    const userEmail = req.params.user;
    db.query(sql,[userEmail], (err, data) => {
        if(err) {
            return res.json("error")
        }
        if(data.length > 0 ){
            return res.json({FirstName: data[0].FirstName, LastName: data[0].LastName, PhoneNumber: data[0].PhoneNumber, password: data[0].Password, Result: "Success"})
        }
    })
})

app.listen(3306,  ()=> {
    console.log("Listening")
})