const express = require('express');
const app = express();
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')    
const PythonShell = require('python-shell').PythonShell
const multer = require('multer')
const nunjucks = require('nunjucks')
const fsExtra = require('fs-extra')

app.set('view engine', 'njk');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

app.use(morgan('dev'))
app.use(express.static('/result.json'));
app.use(express.json())
app.use(express.urlencoded({ extended: false }));

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads/');
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },
});

app.get('/', (req, res) => {
  res.render('main')
})

app.post('/', upload.single('video'), async (req, res, next) => {
  try {
    const { success, err = '' } = await new Promise((resolve, reject) => {
      PythonShell.run('main.py', null, (err) => {
            if(err) {
              reject({ success: false, err })
            }
            resolve({ success: true })
          })
    })
    if(success === true) {
      fs.readFile('result.json', 'utf8', (err, data) => {
        if(err) throw err
        const tmp = JSON.parse(data)
        res.send(tmp)
      })
    } else if(success === undefined) {
      res.send('success is undefined')
    } else {
      res.send('un error occured')
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
  fsExtra.emptyDirSync('./uploads')
});

app.listen('3001')