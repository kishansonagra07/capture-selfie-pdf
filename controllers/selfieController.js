const dataStore = require("nedb");
const db = new dataStore('database.db');
db.loadDatabase();
exports.checkBody = (req, res, next) => {
    if(!req.body.name || !req.body.email || !req.body.mood || !req.body.goal || !req.body.image64){
        return res.status(500).json({
            status: 'error',
            message: 'Missing name / email / mood / goal / webcam'
        });
    }
    next();
}

exports.checkToken = (req,res,next) => {
    var cookie = (req.headers.cookie);
    if(cookie != undefined){
        cookie = cookie.split("=")[1];
        db.find({user_token : cookie}).sort({ timestamp: -1 }).exec(function (err, data) {
            if(err){
                return res.status(500).json({
                    status:'error',
                    data:'Something went wrong'
                });
            }
            req.finalData = data;
            next();
        });
    } else {
        return res.status(500).json({
            status:'error',
            data:'Something went wrong'
        });
    }
}

exports.takeSelfie = (req,res) => {
    const data = {};
    let oldToken = (req.headers.cookie);
    let token;
    if(oldToken === undefined || oldToken === ""){
        token = Math.random().toString(36).substr(2) +  Math.random().toString(36).substr(2) + Math.floor(Date.now() / 1000);
    } else {
        token = oldToken.split("=")[1];
    }
    const timestamp = Date.now();
    const imagePath = Math.random().toString(36).substr(2)+"_"+token+"_"+Math.floor(Date.now() / 1000);
    data.name = req.body.name;
    data.email = req.body.email;
    data.mood = req.body.mood;
    data.goal = req.body.goal;
    data.imagePath = imagePath;
    data.timestamp = Date.now();
    data.user_token = token;
    const base64Data = req.body.image64.replace(/^data:image\/png;base64,/, "");    
    require("fs").writeFile(`./public/pics/${imagePath}.png`, base64Data, 'base64', function(err) {
    });
    db.insert(data);
    res.cookie('userToken',token, { maxAge: 90000000, httpOnly: true });
    return res.status(200).json({
        status:'success',
        data
    });
}

exports.selfieList = (req,res) => {
  const data  = req.finalData;
    return res.status(200).json({
        status:'success',
        data
    });

}

exports.deleteSelfie = (req,res) => {
    const id = req.params.id;
    if(id === undefined && id === ''){
        return res.status(500).json({
            status:'error',
            data:'Something went wrong'
        });
    }
    db.remove({ _id: id }, {}, function (err, data) {
        if(err){
            return res.status(500).json({
                status:'success',
                data:'Something went wrong'
            });
        }
    });
    return res.status(200).json({
        status:'success',
        data:'deleted'
    });
}

exports.makePdf = async (req,res) => {
    const id = req.params.id;
    const data = req.finalData;
    let name,email,mood,goal,image,time;
    var arr = ["Feeling Excited  🤩","Feeling Cool 😎","Feeling Surprise 🤑","Feeling Angry 🤬","Feeling Grateful 🥰","Feeling Heartbroken 💔","Feeling Blessed  🤗"];
    for(let i=0; i < data.length; i++){
        if(data[i]._id === id){
            name = data[i].name;
            email = data[i].email;
            mood = arr[data[i].mood];
            goal = data[i].goal;
            image = data[i].imagePath;
            time = new Date(data[i].timestamp).toLocaleString("hi-IN"); // you can use your timezone instead of IN
        }
    }
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const currentURL = req.protocol + '://' + req.get('host');
    await page.setContent(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Selfie List</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.1.1/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css">
        <style>
        body{background-color:#25274d}.contact{padding:4%;height:400px}.yellow-bg{background:#ff9b00;padding:2%;border-radius:.5rem;height:111px}
        </style>
    </head>
    <body>
    <div class="container contact">
        <div class="row">
            <div class="col-md-12 yellow-bg">
                <div class="contact-info text-center">
                    <h2 style="font-weight:800;color: #007bff;">Selfie App  🤳</h2>
                    <h4>Of Course...You look cool !!</h4>
                </div>
            </div>         
        </div>
        <br/><br/><br/><br/>
        <div class="row">
            <div class="col-md-3">
                <div class="img">
                    <img src="${currentURL}/pics/${image}.png" class="img-thumbnail">
                </div>
            </div>
            <div class="col-md-9" style="color:white;">
                <p><b>Name</b>&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;${name}</p>
                <p><b>Email</b>&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;${email}</p>
                <p><b>Mood</b>&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;${mood}</p>
                <p style="display: inline-flex;"><b>Goal</b>&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;${goal}</p>
                <p><b>Time</b>&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;${time}</p>
            </div>
        </div>
    </div>
    </body>
    </html>`);
    const buffer = await page.pdf({
        path: `public/pdfs/${image}.pdf`, 
        format: "A4",
        printBackground: true,
        margin: {
        left: "0px",
        top: "0px",
        right: "0px",
        bottom: "0px"
        }
    });
    await browser.close();
    return res.status(200).json({
        status:'success',
        data: `${image}.pdf`
    });
  
}