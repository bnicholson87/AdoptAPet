const mongoose = require( 'mongoose' )
const bcrypt = require( 'bcrypt' )

mongoose.connect(process.env.MONGODB_URI,
   {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})

// include mongoose models (it will include each file in the models directory)
const db = require( './models' )

async function userRegister( userData ){
   if( !userData.name || !userData.email || !userData.password ){
      console.log( '[registerUser] invalid userData! ', userData )
      return { status: false, message: 'Invalid user data' }
   }

   // refuse duplicate user emails
   let duplicateUser = await db.users.findOne({ email: userData.email })
   if( duplicateUser && duplicateUser._id ){
      return { status: false, message: 'Duplicate email, try another or login' }
   }

   // hash the password (salt=10)
   const passwordHash = await bcrypt.hash(userData.password, 10)

   const saveData = {
      name: userData.name,
      email: userData.email || '',
      thumbnail: userData.thumbnail || '',
      password: passwordHash
   }
   const saveUser = await db.users.create( saveData )
   if( !saveUser._id ){
      return { status: false, message: `Sorry failed creating entry for ${saveUser.name}: ` }
   }

   return {
      status: true,
      message: `Success! ${saveUser.name} was successfully registered`,
      userData: {
         id: saveUser._id,
         name: saveUser.name,
         email: saveUser.email,
         thumbnail: saveUser.thumbnail
      }
   }
}

async function userLogin( email, password ) {
   const userData = await db.users.findOne({ email: email } )
   if( !userData || !userData._id ) {
      return { status: false, message: 'Invalid login' }
   }

   // compare the passwords to see if valid login
   const isValidPassword = await bcrypt.compare( password, userData.password )
   // console.log( ` [loginUser] checking password (password: ${password} ) hash(${userData.password})`, isValidPassword )
   if( !isValidPassword ) {
      return { status: false, message: 'Invalid password' }
   }

   return {
      status: true,
      message: `Logging in ${userData.name}...`,
      userData: {
         id: userData._id,
         name: userData.name,
         email: userData.email,
         thumbnail: userData.thumbnail
      }
   }
}

async function userSession( userId ){
   const userData = await db.users.findOne({ _id: userId })
   if( !userData || !userData._id ) {
      return { status: false, message: 'Invalid session' }
   }
   return {
      status: true,
      message: '',
      userData: {
         id: userData._id,
         name: userData.name,
         email: userData.email,
         thumbnail: userData.thumbnail
      }
   }
}

async function taskList( ownerId, message='' ){
   // refuse duplicate user emails
   const tasks = await db.tasks.find({ ownerId }, '-ownerId -__v')

   return {
      status: true,
      message,
      tasks
   }
}

async function taskSaveAndList( newTask, ownerId ){
   // refuse duplicate user emails
   const result = await db.tasks.create({ name: newTask, ownerId })
   if( !result._id ){
      return {
         status: false,
         message: 'Sorry could not save task!'
      }
   }

   return taskList( ownerId, 'Task saved' )
}

module.exports = {
   userRegister,
   userLogin,
   userSession,
   taskList,
   taskSaveAndList
};