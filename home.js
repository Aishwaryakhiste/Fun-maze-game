firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        location.replace("index.html")
    } else {
        document.getElementById("email").innerHTML = user.email
    }
})


function logout() {
    firebase.auth().signOut()
}

function showLeaderBoard() {

    const toggle = document.querySelector('#leader-board');
    toggle.style.visibility = 'visible';

}

function HideLeaderBoard() {

    const toggle = document.querySelector('#leader-board');
    toggle.style.visibility = 'hidden';
}