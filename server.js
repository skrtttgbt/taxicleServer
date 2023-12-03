import session from "express-session"
import express from "express"
import cors from "cors"
import mysql2 from 'mysql2'

const app = express ()
app.use(cors({
    origin: ['https://taxicle-app.vercel.app','https://taxicle-admin.vercel.app', 'http://localhost:3000'] , // Specify the allowed origin (your frontend app)
    methods: ["POST", "GET"],
    credentials: true, 
    optionsSuccessStatus: 204,
}))
app.use(express.json())
app.set('trust proxy', 1) 
app.use(session({
    name : 'app.sid',
    secret: "1234567890QWERTY",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true, // Make sure to set this to true only in production when using HTTPS
        httpOnly: true, // Enhances security by preventing client-side access to the cookie
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'None', // Set to 'None' for cross-site cookies
      },
}));
const db = mysql2.createConnection({
    host: "baxywvs3yvftake5nvay-mysql.services.clever-cloud.com",
    port:"20074",
    user: "uqlt5eesvbqfue34",
    password: "Oz57a0EePBp4ec38Gwhc",
    database: "baxywvs3yvftake5nvay",
})

db.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

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

app.get('/admin',(req, res)=> {
    if(req.session.admin) {
        return res.json({valid: true, user: req.session.admin})
    }else{
        return res.json({valid:false})
    }
})


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

 app.get('/admin-report',(req, res)=> {
    const sql = "Select * from report";
    db.query(sql,(err,data) =>{
     if(err)  return res.json("error")
         return res.json({report: data})
     })
 })

 app.post('/admin-case', (req, res) => {
    console.log(req.body.Email, req.body.travelID)
    const sql = "UPDATE report SET CaseEnded = 1 WHERE Email = ? AND TravelID = ?";
    db.query(sql, [req.body.Email, req.body.travelID], (err, data) => {
      if (err) {
        console.error(err);
        return res.json({ message: 'error' });
      }
      return res.json({ message: 'success' });
    });
  });

 
 app.post('/admin-approve',(req, res)=> {
    const sql = "UPDATE users set Verified = 1 WHERE Email = ?";
    db.query(sql,[req.body.email],(err,data) =>{
     if(err)  return res.json("error")
         return res.json({message: 'success'})
     })
 })


app.post('/admin-login',(req, res)=> {
    const sql ="SELECT * From admin WHERE (`adminUser` = ? AND `adminPassword` = ?) OR (`adminEmail` = ? AND `adminPassword` = ?)";
    db.query(sql,[req.body.admin, req.body.password, req.body.admin, req.body.password], (err, data) => {
        if(err) {
            return res.json({message:"error"})
        }
        if(data.length > 0 ){
            req.session.admin = data[0].adminEmail;
            return res.json({Login:true, user: req.session.admin});
        }else{
            const sqlCheckEmail ="SELECT * From admin WHERE `adminUser` = ? OR `adminEmail` = ?";
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

    db.query(sql,[req.body.MinimumFare, req.body.Discount, req.body.Exceeding],(err,data) =>{ 
        if(err)  return res.json("error") 
        return res.json("Success")
    })
})

app.post('/delete-user/:userEmail',(req, res) =>{
    const sql = "DELETE FROM users WHERE Email = ?;";
    db.query(sql,[req.params.userEmail],(err,data) =>{ 
        if(err)  return res.json("error") 
        return res.json("Success")
    })
})
app.get('/',(req, res)=> {
    if(req.session.user) {
    const fareSql = "Select * from fare"
    db.query(fareSql,(err,faredata) =>{
    if(err)  return res.json("error")   
    const sql = "Select UserType, imgPassengerID from users WHERE `Email` = ?"
        db.query(sql,[req.session.user],(err,data) =>{
        return res.json({ fare:faredata,data: data[0], valid: true, user: req.session.user})
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

app.post('/report', (req, res) =>{
    const values = [
        req.body.bodyNumber,
        req.session.user,
        req.session.mobile,
        req.body.from,
        req.body.to,
        req.body.reportType,
        req.body.reportDetails,
        req.body.IncidentDate
    ]  
    const sql ="INSERT INTO report (`BodyNumber`,`Email`,`mobile`,`From`,`To`,`ReportType`,`Complain`,`IncidentDate`) VALUES (?)";
    db.query(sql,[values], (err, data) => {
        if(err) {
            return res.json(err)
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
app.post('/register',
(req, res) => {
    const sqlCheck = "SELECT * FROM users WHERE `Email` = ? OR `PhoneNumber` = ?";
    db.query(sqlCheck,[req.body.email, req.body.PhoneNumber], (err, data) => {
        
        // Prepare values for insertion
        const values = [
          req.body.FirstName,
          req.body.LastName,
          req.body.PhoneNumber,
          req.body.email,
          req.body.confirmPassword,
          req.body.UserType,
          req.body.plateNumID,
          req.body.LicenseNumID,
          req.body.imgMTOP,
          req.body.imgLicense,
          req.body.imgPlateNum,
          req.body.imgPassengerID,
        ];
        if(err) {
            return res.json("error")
        }
        if(data.length > 0 ){
            return res.json("This Email/Cellphone Number has been used!");
        }else{
            const sql ="INSERT INTO users (`FirstName`, `LastName`, `PhoneNumber`, `Email`, `Password`, `UserType`, `PlateNum`, `LicenseNum`, `imgMTOP`, `imgLicense`, `imgPlatenum`, `imgPassengerID`) VALUES (?)";            ;
            db.query(sql,[values], (err, data) => {
                if(err) {
                    return res.json(err)
                }
                return res.json("Success");
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
            req.session.mobile = data[0].PhoneNumber
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

const PORT = process.env.PORT || 3000; // Use port 3000 if environment variable is not set

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
