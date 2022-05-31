const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')    
const PythonShell = require('python-shell').PythonShell
const multer = require('multer')
const nunjucks = require('nunjucks')
const fsExtra = require('fs-extra')

// const corsOpt = {
//     origin: '',//opencv 사용 서버 주소
//     optionsSuccessStatus: 200
// }
app.set('view engine', 'njk');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.render('main')
})

app.post('/', async (req, res) => {
  console.log(req.body.values)
  fsExtra.emptyDirSync('uploads/')
  res.send('ok')
})

try {
  fs.readdirSync('uploads');
} catch (err) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

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

app.post('/videoupload', upload.single('video'), async (req, res, next) => {
  try {
    PythonShell.run('main.py', null, (err) => {
      if(err) next(err)
      console.log(err)
    })
    res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.listen('3001')