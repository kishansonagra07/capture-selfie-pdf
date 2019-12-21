const express = require("express");
const selfieRoute = require("./routes/selfieRoute");

const app = express();
app.use(express.static('public'));
app.use(express.json({limit : '20mb'}));

app.use('/',selfieRoute);

port = 3000;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});