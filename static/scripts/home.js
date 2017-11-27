var homePageApp = new Vue({

    // select DOM element for Vue
    el: '#homePageApp',

    // both Flask and Vue use {{..}} by default
    delimiters: ['${', '}'],

    // data to be kept in client memory
    data: {
        isInGallery: true,
        userLogoutAPI: '/dev/logout',
        userDataAPI: '/dev/api/user/data',
        imageUploadAPI: '/dev/api/pic',
        imageContentAPI: '/dev/api/pic_content',
        accessToken: '',
        picUrls: [],
        thumbnailURLList: [],
        currentTransforms: [],
        currentTransformDesc: ['Original', 'Flopped', 'Red Shifted', 'Sinusoidal']
    },

    // set up on creation values
    created: function() {

        // set access token
        let self = this;
        token = self.getURLParams()["token"];
        if (token.length == 0) {
            swal(
                "Oops...",
                "Invalid user access token, please log in again.",
                "error"
            ).then( function() {
                window.location.href = "/dev";
            });
            return;
        }
        self.accessToken = token;

        // request image urls associated with current user
        let xhr = new XMLHttpRequest();
        xhr.open("GET", self.userDataAPI)
        xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
        xhr.onreadystatechange = function(vm) {
            if (xhr.readyState == 4 && xhr.status == 200) {
                let jsonResponse = JSON.parse(xhr.responseText);
                console.log(jsonResponse);
                self.picUrls = jsonResponse.images;
                return;
            }
            else if (xhr.readyState == 4 && xhr.status == 401) {
                swal(
                    "Oops...",
                    "Invalid user access token, please log in again.",
                    "error"
                ).then( function() {
                    window.location.href = "/dev";
                });
                return;
            }
        }.bind(xhr, this)
        xhr.send();
        return;
    },

    // methods controlling the view
    methods: {

        // general get url parameter method, referenced from:
        // https://gist.github.com/kaioe/8401201
        getURLParams: function() {
            let results = [], hash;
            let hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                hash[1] = unescape(hash[1]);
                results.push(hash[0]);
                results[hash[0]] = hash[1];
            }
            return results;
        },

        switchToImageTransformView: function(index) {
            let self = this;
            self.isInGallery = false;
            let current = self.picUrls.images[index];
            self.currentTransforms.push(self.imageContentAPI + current.origin_url)
            return;
        },

        switchToGalleryView: function() {
            let self = this;
            self.isInGallery = true;
            self.currentTransforms = [];
        },

        uploadNewImage: function() {
            let self = this;
            let formElement = document.getElementById("uploadFormInput");
            let formData = new FormData();
            formData.append("file", formElement.files[0]);
            let xhr = new XMLHttpRequest();
            xhr.open("POST", self.imageUploadAPI)
            xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    swal(
                        "Success!",
                        "Image uploaded successfully.",
                        "success"
                    ).then( function() {
                        self.refreshPicUrls();
                    });
                }
                else if (xhr.readyState == 4 && xhr.status == 400) {
                    swal(
                        "Oops...",
                        "Seems that no image is chosen.",
                        "error"
                    );
                    return;
                }
            }.bind(xhr, this)
            xhr.send(formData);
            return;
        },

        redirectToWelcome: function() {
            let self = this;
            let xhr = new XMLHttpRequest();
            xhr.open("GET", self.userLogoutAPI);
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    swal(
                        "Goodbye!",
                        "You are now logged out.",
                        "success"
                    ).then( function() {
                        window.location.href = "/dev";
                    });
                    return;
                }
            }
            xhr.send();
            return
        },

        refreshPicUrls: function() {
            let self = this;
            let xhr = new XMLHttpRequest();
            xhr.open("GET", self.userDataAPI)
            xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    self.picUrls = jsonResponse.images;
                    return;
                }
                else if (xhr.readyState == 4 && xhr.status == 401) {
                    swal(
                        "Oops...",
                        "Invalid user access token, please log in again.",
                        "error"
                    ).then( function() {
                        window.location.href = "/dev";
                    });
                    return;
                }
            }.bind(xhr, this)
            xhr.send();
            return;
        }

    },

    // watched properties
    watch: {

        picUrls: function(val) {
            let self = this;
            let results = [];
            let len =  val.images.length;
            for (let i = 0; i < len; i++) {
                results.push(self.imageContentAPI + val.images[i].thumb_url);
            }
            self.thumbnailURLList = results;
        }

    }

})