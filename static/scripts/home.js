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
                self.input = '# Hello';
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
                        self.refreshUser();
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

        deleteImage: function() {
            let self = this;
            let currentTransforms = self.currentTransforms;
            if (currentTransforms.length === 0) {
                return;
            }
            let src = currentTransforms[0];
            let index = src.indexOf(self.imageContentAPI);
            let imgUrl = src.substring(index + self.imageContentAPI.length);
            swal({
                title: 'Are you sure?',
                text: 'This image will be deleted.',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then( function() {
                let formData = new FormData();
                formData.append("filepath", imgUrl);
                let xhr = new XMLHttpRequest();
                xhr.open("DELETE", self.imageUploadAPI);
                xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
                xhr.onreadystatechange = function(vm) {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        swal(
                            "Success!",
                            "Journal deleted successfully.",
                            "success"
                        ).then( function() {
                            self.refreshUser();
                            self.switchToImagesTab();
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
            });
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

        refreshUser: function() {
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

        insertImageToJournal: function() {
            let self = this;
            let imageList = '';
            for (let i = 0; i < self.thumbnailURLList.length; i++) {
                imageList += '<img src=' + self.thumbnailURLList[i] + ' onclick="copyImageUrl(src)">';
            }

            swal({
                title: 'Select Image',
                html: imageList,
                focusConfirm: false,
                confirmButtonText: 'Cancel'
            });
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
                            // refresh user data
                            self.refreshUser();
                            // set journal url if this is a new journal
                            if (self.currentJournal === "") {
                                let jsonResponse = JSON.parse(xhr.responseText);
                                self.currentJournal = jsonResponse.url;
                            }
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

        deleteJournal: function() {
            let self = this;
            let currentJournal = self.currentJournal;
            if (currentJournal === "") {
                return;
            }
            swal({
                title: 'Are you sure?',
                text: 'This journal will be deleted.',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then( function() {
                let formData = new FormData();
                formData.append("filepath", currentJournal);
                let xhr = new XMLHttpRequest();
                xhr.open("DELETE", self.journalUploadAPI);
                xhr.setRequestHeader("Authorization", "JWT " + self.accessToken);
                xhr.onreadystatechange = function(vm) {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        swal(
                            "Success!",
                            "Journal deleted successfully.",
                            "success"
                        ).then( function() {
                            self.refreshUser();
                            self.switchToJournalsTab();
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
            });
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
            let elementHandlers = {
                '#journalPDFInput': function(element, renderer) {
                    return true;
                }
            };
            let pdf = new jsPDF("p", "pt", "a4");
            let source = document.getElementById("journalPDFInput");
            pdf.fromHTML(source, 15, 15, {
                'width': 180,
                'elementHandlers': elementHandlers
            }, function() {
                pdf.save('journal.pdf');
            });
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

function copyImageUrl(src) {

    let index = src.indexOf("/dev/api");

    if (index === -1) {
        index = src.indexOf("/api");
    }

    let imgUrl = src.substring(index);
    imgUrl = imgUrl.replace("thumbnail.jpg", "origin.jpg");
    imgUrl = "![Pic](" + imgUrl + ")";

    let link = document.createElement('textarea');
    link.value = imgUrl;
    document.body.appendChild(link);
    link.select();
    let successful = document.execCommand('copy');
    link.click();
    document.body.removeChild(link);

    if (successful) {
        swal(
            "Copied!",
            "Image URL copied to clipboard.",
            "success"
        );
    } else {
        swal(
            "Oops...",
            "Unable to copy image URL.",
            "error"
        );
    }

}