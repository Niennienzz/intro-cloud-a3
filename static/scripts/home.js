var homePageApp = new Vue({

    // select DOM element for Vue
    el: '#homePageApp',

    // both Flask and Vue use {{..}} by default
    delimiters: ['${', '}'],

    // data to be kept in client memory
    data: {
        isInHomeTab: true,
        isInJournalsTab: false,
        isInJournalList: true,
        isInImagesTab: false,
        isInGallery: true,

//        userLogoutAPI: '/dev/logout',
//        userDataAPI: '/dev/api/user/data',
//        imageUploadAPI: '/dev/api/pic',
//        imageContentAPI: '/dev/api/pic_content/',
//        journalUploadAPI: '/dev/api/journal',

        userLogoutAPI: '/logout',
        userDataAPI: '/api/user/data',
        imageUploadAPI: '/api/pic',
        imageContentAPI: '/api/pic_content/',
        journalUploadAPI: '/api/journal',

        accessToken: '',
        currentUser: {},
        thumbnailURLList: [],
        currentTransforms: [],

        input: '# hello'
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
//                window.location.href = "/dev";
                window.location.href = "/";
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
                self.currentUser = jsonResponse;
                return;
            }
            else if (xhr.readyState == 4 && xhr.status == 401) {
                swal(
                    "Oops...",
                    "Invalid user access token, please log in again.",
                    "error"
                ).then( function() {
//                    window.location.href = "/dev";
                    window.location.href = "/";
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

        // home tab
        switchToHomeTab: function() {
            let self = this;
            self.isInHomeTab = true;
            self.isInJournalsTab = false;
            self.isInJournalList = true;
            self.isInImagesTab = false;
            self.isInGallery = true;
            self.currentTransforms = []
        },

        // journals tab, journal list
        switchToJournalsTab: function() {
            let self = this;
            self.isInHomeTab = false;
            self.isInJournalsTab = true;
            self.isInJournalList = true;
            self.isInImagesTab = false;
            self.isInGallery = true;
            self.currentTransforms = []
        },

        // journals tab, editor
        switchToJournalEditorView: function() {
            let self = this;
            self.isInHomeTab = false;
            self.isInJournalsTab = true;
            self.isInJournalList = false;
            self.isInImagesTab = false;
            self.isInGallery = true;
            self.currentTransforms = []
        },

        // images tab, gallery
        switchToImagesTab: function() {
            let self = this;
            self.isInHomeTab = false;
            self.isInJournalsTab = false;
            self.isInJournalList = true;
            self.isInImagesTab = true;
            self.isInGallery = true;
            self.currentTransforms = []
        },

        // images tab, detail
        switchToImageTransformView: function(index) {
            let self = this;
            self.isInHomeTab = false;
            self.isInJournalsTab = false;
            self.isInJournalList = true;
            self.isInImagesTab = true;
            self.isInGallery = false;
            let current = self.currentUser.images[index];
            self.currentTransforms.push(self.imageContentAPI + current);
            return;
        },

        uploadNewImage: function() {
            let self = this;
            let formElement = document.getElementById("uploadImageFormInput");
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
//                        window.location.href = "/dev";
                        window.location.href = "/";
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
                    self.currentUser = jsonResponse;
                    return;
                }
                else if (xhr.readyState == 4 && xhr.status == 401) {
                    swal(
                        "Oops...",
                        "Invalid user access token, please log in again.",
                        "error"
                    ).then( function() {
//                        window.location.href = "/dev";
                        window.location.href = "/";
                    });
                    return;
                }
            }.bind(xhr, this)
            xhr.send();
            return;
        },

        uploadNewJournal: function() {
            let self = this;
            let formElement = document.getElementById("uploadJournalFormInput");
            let formData = new FormData();
            formData.append("file", formElement.value);
            let xhr = new XMLHttpRequest();
            xhr.open("POST", self.journalUploadAPI)
            xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    swal(
                        "Success!",
                        "Journal uploaded successfully.",
                        "success"
                    ).then( function() {
                        self.refreshPicUrls();
                    });
                }
                else if (xhr.readyState == 4 && xhr.status == 400) {
                    swal(
                        "Oops...",
                        "Seems that no journal is chosen.",
                        "error"
                    );
                    return;
                }
            }.bind(xhr, this)
            xhr.send(formData);
            return;
        },

        update: _.debounce(function (e) {
            this.input = e.target.value
        }, 300)

    },

    // watched properties
    watch: {

        currentUser: function(val) {
            let self = this;
            let results = [];
            let len =  val.images.length;
            for (let i = 0; i < len; i++) {
                results.push(self.imageContentAPI + val.images[i].replace("origin.jpg", "thumbnail.jpg"));
            }
            self.thumbnailURLList = results;
        }

    },

    // computed properties
    computed: {
        compiledMarkdown: function () {
            return marked(this.input, { sanitize: true })
        }
    }

})