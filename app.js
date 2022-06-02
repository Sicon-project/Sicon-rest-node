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

app.post('/', async (req, res) => {
  console.log(req.body.values)
  fsExtra.emptyDirSync('./uploads')
  res.send('ok')
})

app.post('/tmp', async(req, res, next) => {
  try{
    fs.readFile('result.json', 'utf8', (err, data) => {
      if(err) throw err
      const tmp = JSON.parse(data)
      res.send(tmp)
    })
  } catch(err) {
    console.log(err)
    next(err)
  }
})

app.post('/videoupload', upload.single('video'), async (req, res, next) => {
  try {
    const { success, err = '', results } = await new Promise((resolve, reject) => {
      PythonShell.run('main.py', null, (err, results) => {
            if(err) {
              reject({ success: false, err })
            }
            console.log(`py results: ${results}`)
            resolve({ success: true, results })
          })
    })
    
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.listen('3001')