document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault()
})

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        location.replace("home.html")
    }
})

function login() {
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch((error) => {
            document.getElementById("error").innerHTML = error.message
        })
}
var name = document.getElementById("name").value;
console.log(name);


function signUp() {
    const email = document.getElementById("email").value
    const username = document.getElementById("name").value
    const password = document.getElementById("password").value
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch((error) => {
            document.getElementById("error").innerHTML = error.message
        });


}

function forgotPass() {
    const email = document.getElementById("email").value
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            alert("Reset link sent to your email id")
        })
        .catch((error) => {
            document.getElementById("error").innerHTML = error.message
        });
}