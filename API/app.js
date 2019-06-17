const express = require("express");
const http = require("http");
const { compilers } = require("./compilers");
const SandBox = require("./DockerSandbox");
const bodyParser = require("body-parser");
const app = express();
const server = http.createServer(app);
const port = 8080;

const ExpressBrute = require("express-brute");
const store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
const bruteforce = new ExpressBrute(store, {
  freeRetries: 50,
  lifetime: 3600
});

app.use(express.static(__dirname));
app.use(bodyParser.json());

app.all("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  next();
});

function random(size) {
  //returns a crypto-safe random
  return require("crypto")
    .randomBytes(size)
    .toString("hex");
}

app.post("/compile", bruteforce.prevent, (req, res) => {
  let language = req.body.language;
  let code = req.body.code;
  let stdin = req.body.stdin;

  let folder = `temp/${random(10)}`; //folder in which the temporary folder will be saved
  let path = `${__dirname}/`; //current working path
  let vm_name = "virtual_machine"; //name of virtual machine that we want to execute
  let timeout_value = 20; //Timeout Value, In Seconds

  //details of this are present in DockerSandbox.js
  let sandbox = new SandBox(
    timeout_value, // timeout_value
    path, // path
    folder, // folder
    vm_name, // vm_name
    compilers[language][0], //compiler_name
    compilers[language][1], //file_name
    code, //code
    compilers[language][2], //output_command
    compilers[language][3], //languageName
    compilers[language][4], //e_arguments
    stdin //stdin_data
  );

  //data will contain the output of the compiled/interpreted code
  //the result maybe normal program output, list of error messages or a Timeout error
  sandbox.run((data, exec_time, err) => {
    //console.log("Data: received: "+ data)
    res.send({
      output: data,
      langid: language,
      code: code,
      errors: err,
      time: exec_time
    });
  });
});

app.get("/", function(req, res) {
  res.sendfile("./index.html");
});

console.log("Listening at " + port);
server.listen(port);
