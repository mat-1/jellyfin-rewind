import './style.css'

import { reactive, html } from '@arrow-js/core'

import javascriptLogo from './javascript.svg'
import * as jellyfinRewind from './src/rewind.js'
import JellyHelper from './src/jelly-helper.js'

import * as Features from './src/features.js'

document.querySelector('#app').innerHTML = `
`
// {/* <div>
//   <a href="https://vitejs.dev" target="_blank">
//     <img src="/vite.svg" class="logo" alt="Vite logo" />
//   </a>
//   <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
//     <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
//   </a>
//   <h1>Hello Vite!</h1>
//   <div class="card">
//     <button id="counter" type="button"></button>
//   </div>
//   <p class="read-the-docs">
//     Click on the Vite logo to learn more
//   </p>
// </div> */}

let userInfo = null;
let helper = null;

const connectToServerButton = document.querySelector(`#connectToServer`)
const serverUrl = document.querySelector(`#serverUrl`)
const serverConfig = document.querySelector(`#server-config`)
const userSelect = document.querySelector(`#user-select`)
const userLogin = document.querySelector(`#user-login`)
const manualUser = document.querySelector(`#manual-user`)
const usernameInput = document.querySelector(`#username-input`)
const username = document.querySelector(`#username`)
const password = document.querySelector(`#password`)
const authenticateUser = document.querySelector(`#authenticateUser`)
const showReport = document.querySelector(`#show-report`)
const generateReport = document.querySelector(`#generate-report`)
const loadingSpinner = document.querySelector(`#loading-spinner`)
const output = document.querySelector(`#output`)
const logOutButton = document.querySelector(`#log-out`)

let selectedUsername = ``

window.onload = () => {

  if (jellyfinRewind.auth.restoreSession()) {
    console.info(`Session restored!`)
    enableLogout()
    serverConfig.classList.add(`hidden`)
    init()
  }
  
}

function enableLogout() {
  logOutButton.classList.remove(`hidden`)
  logOutButton.addEventListener(`click`, () => {
    jellyfinRewind.auth.destroySession()
    window.location.reload()
  })
}

connectToServerButton.addEventListener(`click`, connectToServer)
serverUrl.addEventListener(`keydown`, (event) => {
  if (event.key === `Enter`) {
    connectToServer()
  }
})

async function connectToServer() {
  try {
    await jellyfinRewind.auth.connectToServer(serverUrl.value)
    userInfo = await jellyfinRewind.auth.fetchUsers()
    console.info(`Connected to server!`)
    console.info(`Users:`, userInfo)
    serverConfig.classList.add(`hidden`)
    showUsers()
  } catch (err) {
    console.error(`Error while connecting to the server:`, err)
  }
}

function showUsers() {

  userSelect.classList.remove(`hidden`)
  
  manualUser.addEventListener(`click`, () => {
    userLogin.classList.remove(`hidden`)
    usernameInput.classList.remove(`hidden`)
    userSelect.classList.add(`hidden`)
    username.addEventListener(`keyup`, () => {
      selectedUsername = username.value
    })
    authenticateUser.removeEventListener(`click`, login(``))
    authenticateUser.addEventListener(`click`, login(``))
    password.removeEventListener(`keydown`, login(``))
    password.addEventListener(`keydown`, login(``))
  })
  
  userInfo.forEach(user => {
    const li = document.createElement(`li`)
    const button = document.createElement(`button`)
    button.textContent = user.Name
    button.setAttribute(`data-user-id`, user.Id)
    button.classList.add(`rounded-md`, `p-2`, `cursor-pointer`, `focus:bg-blue-200`, `hover:bg-blue-200`)
    button.addEventListener(`click`, () => {
      userLogin.classList.remove(`hidden`)
      selectedUsername = user.Name
      console.info(`User selected:`, user)
      userSelect.classList.add(`hidden`)
      authenticateUser.removeEventListener(`click`, login(user.Id))
      authenticateUser.addEventListener(`click`, login(user.Id))
      password.removeEventListener(`keydown`, login(user.Id))
      password.addEventListener(`keydown`, login(user.Id))
    })
    li.appendChild(button)
    userSelect.appendChild(li)
  })
}

const login = (userId) => async (event) => {

  if (event.type !== `click` && event.key !== `Enter`) {
    return
  } 
  
  try {

    await jellyfinRewind.auth.authenticateUser(selectedUsername, password.value)
    console.info(`Successfully logged in as ${selectedUsername}`)
    jellyfinRewind.auth.saveSession()

    userLogin.classList.add(`hidden`)
    init()
    
  } catch (err) {
    console.error(`Error while logging in:`, err)
  }
}

function init() {
  showReport.addEventListener(`click`, async () => {
    let rewindReport = null
    try {
      rewindReport = jellyfinRewind.restoreRewindReport()
    } catch (err) {
      console.warn(`Couldn't restore Rewind report:`, err)
      console.info(`Generating new report...`)
      rewindReport = await generateRewindReport()
    }

    showRewindReport(rewindReport)
    initializeFeatureStory(rewindReport)

  })
  generateReport.addEventListener(`click`, async () => {
    console.info(`Generating new report...`)
    let rewindReport = await generateRewindReport()

    showRewindReport(rewindReport)
    initializeFeatureStory(rewindReport)

  })
  generateReport.classList.remove(`hidden`)
  showReport.classList.remove(`hidden`)
  helper = new JellyHelper(jellyfinRewind.auth)
}

async function generateRewindReport() {

  try {
    
    loadingSpinner.classList.remove(`hidden`)
    const report = await jellyfinRewind.generateRewindReport()
    console.info(`Report generated successfully!`)
    jellyfinRewind.saveRewindReport()
    
    return report    
  } catch (err) {
    console.error(`Error while generating the report:`, err)
  }
  
}

function showRewindReport(report) {

  output.value = JSON.stringify(report, null, 2)
    loadingSpinner.classList.add(`hidden`)

    const topSongByDuration = report.tracks?.[`topTracksByPlayCount`]?.[0]

    if (topSongByDuration) {
      document.querySelector('#app').innerHTML += `
        <div class="m-4 text-gray-800">
          <h3 class="text-xl">Your Top Song of the Year</h3>
          <div class="flex mt-4 flex-col">
            <img id="test-image" class="w-64 h-auto rounded-md" />
            <span class="font-semibold mt-2">${topSongByDuration?.name}</span>
            <span class="italic pl-3 mt-1">by ${topSongByDuration.artistsBaseInfo.reduce((acc, cur, index) => index > 0 ? `${acc} & ${cur.name}` : cur.name, ``)}</span>
          </div>
        </div>
      `
      const testImage = document.querySelector(`#test-image`)
      helper.loadImage(testImage, topSongByDuration.image)
    }
  
}

function initializeFeatureStory(report) {

  Features.init(report, helper)

}