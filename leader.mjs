import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFmXn_JMPKDgu_ELDGUkEfqhkWmY3eCqM",
    authDomain: "auth-e64cd.firebaseapp.com",
    databaseURL: "https://auth-e64cd-default-rtdb.firebaseio.com",
    projectId: "auth-e64cd",
    storageBucket: "auth-e64cd.appspot.com",
    messagingSenderId: "907300081039",
    appId: "1:907300081039:web:2e1623c9b3b8a9cc728ffa",
    measurementId: "G-DH0175KZF1"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();

//firebase.initializeApp(firebaseConfig);
// const db = getDatabase();
// firebase.analytics();

import { getDatabase, ref, child, onValue, get }
from 'https://www.gstatic.com/firebasejs/9.9.0/firebase-database.js';

//var database = firebase.database(app)


function save() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    database.ref('users/' + password).set({
        email: email,
        password: password,
        name: name,
        score: score,
        endtime: endtime
    })

}




var stdNo = 0;
var tbody = document.getElementById("tbody1");


function AddItemsToTable(email, score, time) {
    let trow = document.createElement("tr");
    let td1 = document.createElement('td');
    let td2 = document.createElement('td');
    let td3 = document.createElement('td');
    let td4 = document.createElement('td');

    td1.innerHTML = ++stdNo;
    td2.innerHTML = email;
    td3.innerHTML = score;
    td4.innerHTML = time;

    trow.appendChild(td1);
    trow.appendChild(td2);
    trow.appendChild(td3);
    trow.appendChild(td4);
    tbody.appendChild(trow);
}

function AddAllItemsToTable(TheStudent) {
    stdNo = 0;
    tbody.innerHTML = "";
    TheStudent.forEach(element => {
        AddItemsToTable(element.email, element.score, element.EndTime)
    });
}



//---------------------GETTING ALL DATA-----------------




function GetAllDataOnce() {
    const dbRef = ref(db);
    get(child(dbRef, "users"))
        .then((snapshot) => {
            var students = [];
            snapshot.forEach(childSnapshot => {
                students.push(childSnapshot.val());
            });
            AddAllItemsToTable(students);
        });


}
window.onload = GetAllDataOnce();