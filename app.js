const express = require('express')
const app = express()
const path = require('path')
const session = require('express-session')
const mongodbsession = require('connect-mongodb-session')(session)
const bcrypt = require('bcryptjs')
const port = 3000
const User = require('./models/User')

//MongoDb Connection, Schema and Model-Mongoose
const mongoose = require('mongoose');
mongoose
    .connect('mongodb://localhost/ArjunJewellers', {useNewUrlParser: true})
    .then((res)=>{
        console.log('Connected to database')
    })


//FOR SERVING STATIC FILE EX. IMAGES
app.use('/static', express.static('static'))

// FOR USING PUG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use(express.json())
app.use(express.urlencoded())

const store  = new mongodbsession({
    uri: 'mongodb://localhost/ArjunJewellers',
    collection: 'UserSessions'
})
app.use(session({
    secret: "superkey",
    resave: false,
    saveUninitialized: false,
    store: store,
    // cookie: {
    //     maxAge: 30 * 1000 // 1 day in milliseconds
    //   }
}))

const isAuth = (req, res, next)=>{
    if(req.session.isAuth){
        next()
    }else{
        res.redirect('/login')
    }
}

app.get('/', (req, res) => {
  //console.log(req.session)
  //req.session.isAuth = true
  res.render('index', {user: req.session.isAuth})
})

app.get('/register', (req,res)=>{
    res.render('register', {user: req.session.isAuth})
})

app.post('/register', async (req,res)=>{
    const {name, email, password} = req.body;

    const isUser = await User.findOne({name});
    if(isUser){
        return res.redirect('/register');
    }

    const hashedPass = await bcrypt.hash(password, 12);

    const user = new User({
        name,
        email,
        password: hashedPass
    })

    await user.save().then(()=>{
        res.redirect('/login')
    }).catch((err)=>{
        res.send(err)
    })

})

app.get('/login', (req, res) => {
    res.render('login', {user: req.session.isAuth})
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user){
        return res.redirect('/login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch){
        return res.redirect('/login')
    }
    req.session.isAuth = true
    res.redirect('/dashboard')
})

app.get('/dashboard', isAuth, (req, res) => {
    res.render('dashboard', {user: req.session.isAuth})
})

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard'); // or some error handling
        }
        // if not using clearCookie(), Session data in session is being deleted (as expected). But cookie in the user browser is still there.
        res.clearCookie('connect.sid'); // 'connect.sid' is the default cookie name used by express-session
        res.redirect('/login')
    })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})