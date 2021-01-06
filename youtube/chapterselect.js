// ==UserScript==
// @name     YouTube chapter select
// @namespace  http://tampermonkey.net/
// @version    0.1
// @description  Allow some hotkey control over chapter navigation in youtube.
// @author     codewillclick
// @match    https://www.youtube.com/watch?v=*
// @grant    none
// ==/UserScript==

(function() {

  var state = {
    initialized: false,
    chapters: [],
    chapterTable: {},
    duration: 0
  }

  window.addEventListener('keydown',(e) => {
    if (e.shiftKey) {
      let zero = '0'.charCodeAt(0)
      if (zero <= e.keyCode && e.keyCode < zero+10) {
        // Specific chapter index.
        var v = e.keyCode - zero
        v = v === 0 ? 9 : v-1
        doThingTo(v)
        e.preventDefault()
      }
      return
    }
    if (e.key === 'p') {
      // Previous chapter.
      doThing(-1)
    }
    else if (e.key === 'n') {
      // Next chapter.
      doThing(1)
    }
    else if (e.key === 'r') {
      // Restart current chapter.
      doThing(0)
    }
  })

  function doThing(jump) {
    if (!state.initialized)
      init()

    // Get current time.
    var tdiv = document.querySelector('.ytp-time-current')
    var currentTime = toSeconds(tdiv.innerText)

    // Determine which chapter is current.
    var currentIndex = state.chapters.length-1
    for (var i in state.chapters) {
      var [k,v] = state.chapters[i]
      if (currentTime < v) {
        currentIndex = i-1
        break
      }
    }
    // Check real quick if the jump is valid.
    if (currentIndex+jump < 0 || currentIndex+jump >= state.chapters.length)
      return

    doThingTo(currentIndex+jump)
  }

  function doThingTo(index) {
    if (!state.initialized)
      init()

    // Gonna have to go off this new side-chapter list.  Clicking the player bar doesn't work.
    var tmr = Array.from(document.querySelectorAll('#time'))
    var tmdiv = tmr[index]
    tmdiv.click()
  }

  function init() {
    // Grab chapter times from video description.
    try {
			// TODO: This entire block may just be unnecessary now that clicking
			//   proved infeasible.
      var descr = document.querySelector('#content ytd-expander.ytd-video-secondary-info-renderer')
      var r = descr.innerText.split('\n').filter(s=>/\d\d:\d\d/.test(s))
      for (var s of r) {
        var m = s.match(/\d\d:\d\d(:\d\d)?/g)
        var ts = m[0]
        let sec = toSeconds(ts)
        console.log(s,ts,sec)
        state.chapterTable[s] = sec
      }
    } finally {
      state.initialized = true
      for (var k in state.chapterTable)
        state.chapters.push([k,state.chapterTable[k]])
    }

    // Get time duration.
    var duration = document.querySelector('.ytp-time-duration')
    let sec = toSeconds(duration.innerText)
    state.duration = sec
  }

  function toSeconds(ts) {
    var r = [1,60,60*60]
    var x = 0
    var v = 0
    var tr = ts.split(':')
    for (var i in tr) {
      let s = tr[tr.length-i-1]
      v += parseInt(s) * r[x++]
    }
    return v
  }
})();
