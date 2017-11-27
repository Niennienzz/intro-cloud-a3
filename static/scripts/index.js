var welcomePageApp = new Vue({

    // select DOM element for Vue
    el: '#welcomePageApp',

    // data to be kept in client memory
    data: {
        isOnLoginTab: true,
        userAuthAPI: '/dev/auth',
        userLoginAPI: '/dev/login',
        userRegisterAPI: '/dev/api/user/register'
    },

    // methods controlling the view
    methods: {

        switchToRegisterTab: function() {
            this.isOnLoginTab = false;
        },

        switchToLoginTab: function() {
            this.isOnLoginTab = true;
        },

        checkRegisterForm: function() {
            let self = this;
            let username = document.getElementById("registerUsername").value;
            let password = document.getElementById("registerPassword").value;
            if (username.length == 0 || password.length == 0) {
                swal(
                    "Oops...",
                    "Empty username or password, please try again.",
                    "error"
                );
                return;
            }
            let xhr = new XMLHttpRequest();
            xhr.open("POST", self.userRegisterAPI);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 201) {
                    swal(
                        "Success!",
                        "User created, please log in.",
                        "success"
                    ).then( function() {
                        self.isOnLoginTab = true;
                    });
                    return;
                }
                else if (xhr.readyState == 4 && xhr.status == 400) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    if (jsonResponse.message == "user already exists") {
                        swal(
                            "User Already Exists.",
                            "Please log in.",
                            "question"
                        ).then( function() {
                            self.isOnLoginTab = true;
                        });
                        return;
                    }
                    return;
                }
            }.bind(xhr, this)
            xhr.send(JSON.stringify({username: username, password: password}));
            return;
        },

        checkLoginForm: function() {
            let self = this;
            let username = document.getElementById("loginUsername").value;
            let password = document.getElementById("loginPassword").value;
            if (username.length == 0 || password.length == 0) {
                swal(
                    "Oops...",
                    "Empty username or password, please try again.",
                    "error"
                );
                return;
            }
            let xhr = new XMLHttpRequest();
            xhr.open("POST", self.userAuthAPI);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    access_token = jsonResponse.access_token;
                    self.redirectToHome(access_token);
                    return;
                }
                else if (xhr.readyState == 4 && xhr.status == 401) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    if (jsonResponse.description == "Invalid credentials") {
                        swal(
                            "Oops...",
                            "Invalid username or password, please try again.",
                            "error"
                        );
                        return;
                    }
                    return;
                }
            }.bind(xhr, this)
            xhr.send(JSON.stringify({username: username, password: password}));
            return;
        },

        redirectToHome: function(access_token) {
            let self = this;
            let xhr = new XMLHttpRequest();
            let formData = new FormData();
            formData.append("token", access_token);
            xhr.open("POST", self.userLoginAPI);
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    swal(
                        "Success!",
                        "Redirecting to home page...",
                        "success"
                    ).then( function() {
                        window.location.href = "/dev" + jsonResponse.redirect;
                    });
                    return;
                }
            }
            xhr.send(formData);
            return
        }

    }

})
