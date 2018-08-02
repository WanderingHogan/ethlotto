const crypto = require('crypto')
const ethUtils = require('ethereumjs-util')
const chalk = require('chalk')
const Web3 = require('web3')
const web3 = new Web3()
const fs = require('fs')
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

let date = new Date();
let todaysDate = date.yyyymmdd();

var writeObj = {
    checked: 0,
    usedWallets: 0
};

var wallets = {
    checked: 0,
    usedWallets: 0
};

//const totalAddresses = 4631683569492647816942839400347516314130799386625622561578303360316525185598;

// check to see if count file exists, if not, create it
fs.readFile('data/stats.json', 'utf8', function(err, data) {
    console.log('Checking for Stats file.')
    if (err) {
        fs.writeFile('data/stats.json', JSON.stringify(writeObj), 'utf8', function(err) {
            if (err) {
                return console.log(err);
            }
        });
    } else {
        writeObj = JSON.parse(data); //now it an object
    }
    date = new Date();
    todaysDate = date.yyyymmdd();
    console.warn('writeObj', writeObj)
});

// check to see if count file exists, if not, create it
// fs.readFile(`data/${todaysDate}unused.txt`, 'utf8', function(err, data) {
//     console.log(' Checking for unused key list.')
//     if (err) {
//         console.log(`${chalk.red("...Un-used file NOT found, creating one.")}`)
//         fs.writeFile(`data/${todaysDate}unused.txt`, 'address, privkey, balance\n', 'utf8', function(err) {
//             if (err) {
//                 return console.log(err);
//             }
//         });
//     }
//     else {
//         console.log(`${chalk.green("...Un-used file exists, using it.")}`)
//     }
// });

// check to see if count file exists, if not, create it
fs.readFile(`data/used.txt`, 'utf8', function(err, data) {
    console.log(' Checking for used key list.')
    if (err) {
        fs.writeFile(`data/used.txt`, 'address, privkey, balance\n', 'utf8', function(err) {
            if (err) {
                return console.log(err);
            }
        });
    }
    else {
        console.log(`${chalk.green("...Used file exists, using it.")}`)
    }
});

web3.setProvider(new web3.providers.HttpProvider('https://api.myetherapi.com/eth'))

const getRandomWallet = function() {
    var randbytes = crypto.randomBytes(32)
    var address = '0x' + ethUtils.privateToAddress(randbytes).toString('hex')
    return { address: address, privKey: randbytes.toString('hex') }
}

let checked = 0

const onToTheNextOne = function() {
    const account = getRandomWallet()
    web3.eth.getBalance(account.address).then(e => {
        // console.log(e, account, writeObj)
        // checked = writeObj.checked
        // checked++

        writeObj.checked++
        // io.emit('new data', { for: 'everyone' });
        fs.writeFile('data/stats.json', JSON.stringify(writeObj), 'utf8', function(err) {
            if (err) {
                return console.log(err);
            }

        }); // write it back 
        if (Number(e) > 0) {
            // fs.appendFile('accounts.txt', `${JSON.stringify(account)} \n`, () => {})
            writeObj.usedWallets = writeObj.usedWallets += 1;
            fs.writeFile('data/stats.json', JSON.stringify(writeObj), 'utf8', function(err) {
                if (err) {
                    return console.log(err);
                }
            }); // write it back 
            fs.appendFile(`data/used.txt`, `${JSON.stringify(account.address)}, ${JSON.stringify(account.privKey)}, ${e}\n`, () => {})
            // console.log(`${chalk.green(account.address)} - ${e} - ${checked}`)
            onToTheNextOne()
        } else {
            io.emit('new data', account.address, account.privKey, e, writeObj.checked, writeObj.usedWallets);
            // fs.appendFile(`data/${todaysDate}unused.txt`, `${JSON.stringify(account.address)}, ${JSON.stringify(account.privKey)}, ${e}\n`, () => {})
            // console.log(`${chalk.blue(account.address)} - ${e} - ${checked}`)
            onToTheNextOne()
        }
    })
}

onToTheNextOne()

app.get('/', function(req, res){
  // res.send(`<h1>Hello world${writeObj.checked}</h1>`);
  res.sendFile(__dirname + '/static/index.html');
});

// io.on('connection', function(socket){
//   console.log('a user connected');
// });

http.listen(3000, function(){
  console.log('listening on *:3000');
});