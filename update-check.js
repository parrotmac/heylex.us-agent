const child_process = require("child_process")

function systemSync(cmd){
  child_process.exec("git fetch", (err, stdout, stderr) => {
    console.log('stdout is:' + stdout)
    console.log('stderr is:' + stderr)
    console.log('error is:' + err)
  }).on('exit', function(code) {
      console.log('final exit code is', code)
  })
}