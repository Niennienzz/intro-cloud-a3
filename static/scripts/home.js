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
        autoJnlTimer: '',
        autoJnlTimeString: '',

//        userLogoutAPI: '/dev/logout',
//        userDataAPI: '/dev/api/user/data',
//        imageUploadAPI: '/dev/api/pic',
//        imageContentAPI: '/dev/api/pic_content/',
//        journalUploadAPI: '/dev/api/journal',
//        journalContentAPI: '/dev/api/journal_content/',
//        journalPDFAPI: '/dev/api/journal_pdf',

        userLogoutAPI: '/logout',
        userDataAPI: '/api/user/data',
        imageUploadAPI: '/api/pic',
        imageContentAPI: '/api/pic_content/',
        journalUploadAPI: '/api/journal',
        journalContentAPI: '/api/journal_content/',
        journalPDFAPI: '/api/journal_pdf',

        accessToken: '',
        currentUser: {},
        thumbnailURLList: [],
        currentTransforms: [],
        journalURLList: [],
        currentJournal: '',

        input: '# Hello'
    },

    // set up on creation values
    created: function() {

        let self = this;

        // set timer
        self.autoJnlTimer = setInterval(self.autoUploadJournal, 15000);

        // set access token
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
        xhr.open("GET", self.userDataAPI);
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
            self.currentTransforms = [];
            self.currentJournal = '';
        },

        // journals tab, journal list
        switchToJournalsTab: function() {
            let self = this;
            self.isInHomeTab = false;
            self.isInJournalsTab = true;
            self.isInJournalList = true;
            self.isInImagesTab = false;
            self.isInGallery = true;
            self.currentTransforms = [];
            self.currentJournal = '';
        },

        // journals tab, editor
        switchToJournalEditorView: function(url) {
            let self = this;
            self.isInHomeTab = false;
            self.isInJournalsTab = true;
            self.isInJournalList = false;
            self.isInImagesTab = false;
            self.isInGallery = true;
            self.currentTransforms = [];
            if (url !== '') {
                self.currentJournal = url;
            }
            else {
                self.currentJournal = '';
            }
        },

        // images tab, gallery
        switchToImagesTab: function() {
            let self = this;
            self.isInHomeTab = false;
            self.isInJournalsTab = false;
            self.isInJournalList = true;
            self.isInImagesTab = true;
            self.isInGallery = true;
            self.currentTransforms = [];
            self.currentJournal = '';
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
            self.currentJournal = '';
            return;
        },

        uploadNewImage: function() {
            let self = this;
            let formElement = document.getElementById("uploadImageFormInput");
            let formData = new FormData();
            formData.append("file", formElement.files[0]);
            let xhr = new XMLHttpRequest();
            xhr.open("POST", self.imageUploadAPI);
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

        uploadJournal: function() {
            let self = this;
            let formElement = document.getElementById("journalFormInput");
            let formData = new FormData();
            formData.append("file", formElement.value);
            let xhr = new XMLHttpRequest();
            let method = "POST";
            if (self.currentJournal !== '') {
                method = "PUT";
                formData.append("filepath", self.currentJournal);
            }
            xhr.open(method, self.journalUploadAPI);
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

        autoUploadJournal: function() {
            let self = this;
            let formElement = document.getElementById("journalFormInput");
            if (!formElement) {
                return;
            }
            let formData = new FormData();
            formData.append("file", formElement.value);
            let xhr = new XMLHttpRequest();
            let method = "POST";
            if (self.currentJournal !== '') {
                method = "PUT";
                formData.append("filepath", self.currentJournal);
            }
            xhr.open(method, self.journalUploadAPI);
            xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    let dt = new Date();
                    let utcDate = dt.toUTCString();
                    self.autoJnlTimeString = "Auto Saved: " + utcDate;
                }
            }.bind(xhr, this)
            xhr.send(formData);
            return;
        },

        downloadJournal: function() {
            let self = this;
            let formData = new FormData();
            formData.append("markdown", self.compiledMarkdown);
            let xhr = new XMLHttpRequest();
            xhr.open("POST", self.journalPDFAPI);
            xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
            xhr.responseType = "blob";
            xhr.onload = function(e) {
                if (this.status == 200) {
                    let blob = xhr.response;
                    let link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = "journal.pdf";
                    link.click();
                } else {
                    swal(
                        "Oops...",
                        "Unable to download PDF.",
                        "error"
                    );
                }
            };
            xhr.send(formData);
        },

        update: _.debounce(function (e) {
            this.input = e.target.value
        }, 300)

    },

    // watched properties
    watch: {

        currentUser: function(val) {
            let self = this;
            let thumbList = [];
            let len =  val.images.length;
            for (let i = 0; i < len; i++) {
                thumbList.push(self.imageContentAPI + val.images[i].replace("origin.jpg", "thumbnail.jpg"));
            }
            self.thumbnailURLList = thumbList;
            self.journalURLList = val.journals;
        },

        currentJournal: function(val) {
            if (val === "") {
                return;
            }
            let self = this;
            let xhr = new XMLHttpRequest();
            xhr.open("GET", self.journalContentAPI + val);
            xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
            xhr.onreadystatechange = function(vm) {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    self.input = xhr.responseText;
                    return;
                }
            }.bind(xhr, this)
            xhr.send();
            }

    },

    // computed properties
    computed: {
        compiledMarkdown: function () {
            return marked(this.input, { sanitize: true })
        }
    }

})