'use strict';

var omniToggl = {
    data: '',
    hoursThisWeek: 0,
    minutes: 0,
    liveTimeSelector: '.input-duration',
    alertedOnSetting: false,
    alertedOnRequeriments: false,
    money: 0,
    init: function init() {
        document.addEventListener('readystatechange', function () {

            var timerObserver = omniToggl.timerMode();
            omniToggl.startOmniTrack();
            var startObserving = function() {
                var mainLoop;
                if (document.hidden) {
                    clearInterval(mainLoop);
                } else {
                    mainLoop = setInterval(function() {
                        switch (window.location.href) {
                            case "https://www.toggl.com/app/timer":
                                timerObserver.observe(document, {
                                    subtree: true,
                                    attributes: true
                                });
                                omniToggl.observeOmniTrack.disconnect();
                                break;
                            case "https://www.toggl.com/app/reports":
                                omniToggl.observeOmniTrack.observe(document, {
                                    subtree: true,
                                    attributes: true,
                                    characterData: true,
                                    childList: true
                                });
                                timerObserver.disconnect();
                                break;
                        }
                    }, 1000);
                }
            };
            if (document.readyState === 'complete') {
                document.addEventListener('visibilitychange', startObserving);
                startObserving();
            }
        });
    },
    timerMode: function timerMode() {
        var selector = '.barchart-total';
        chrome.storage.sync.get({
            hourlyWage: 1,
            useMinutes: false,
            currencyCharacter: '$'
        },  omniToggl.liveMoney);

        return new MutationObserver(function (mutations, observer) {

            mutations.forEach(function () {
                if (omniToggl.getTrackedTime(selector) !== '') {
                    omniToggl.genericObserver(selector, omniToggl.startMain);
                    omniToggl.startMain();
                    observer.disconnect();
                }
            });
        });
    },
    genericObserver: function genericObserver(selector, callback) {

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function () {
                callback();
            });
        });

        observer.observe(document.querySelector(selector), {
            subtree: false,
            attributes: true,
            characterData: false,
            childList: false
        });
    },
    getTrackedTime: function getTrackedTime(selector) {
        var elm = document.querySelector(selector);
        if (elm !== undefined && elm !== null) {
            if (elm.innerHTML !== '') {
                omniToggl.data = elm.innerHTML;
            }
        } else {
            if (!omniToggl.alertedOnRequeriments) {
                alert('Toggle-show-me-the-money needs you to enable Footer chart -> this week in toggle.com settings');
                omniToggl.alertedOnRequeriments = true;
            }
        }
        return omniToggl.data;
    },
    startMain: function startMain() {
        chrome.storage.sync.get({
            hourlyWage: -1,
            useMinutes: false,
            currencyCharacter: '$'
        }, omniToggl.main);
    },
    main: function(items) {
        var selector = '.barchart-total';
        omniToggl.data = omniToggl.getTrackedTime(selector);
        omniToggl.hoursThisWeek = omniToggl.data.split('h')[0];
        if (items.useMinutes) {
            omniToggl.hoursThisWeek = parseInt(omniToggl.hoursThisWeek,10) + parseInt(omniToggl.data.split('h')[1], 10)/60;
        }
        omniToggl.money = omniToggl.hoursThisWeek * items.hourlyWage;
        if (omniToggl.money < 0 && !omniToggl.alertedOnSetting) {
            omniToggl.alertedOnSetting = true;
            alert(chrome.i18n.getMessage('noHourlyWageSet'));
        }
        var parentElm = document.querySelector('.top-bar ul');
        var node = document.querySelector('.omni-money');
        if (node === null) {
            node = document.createElement('li');
        }

        node.className = 'omni-money';
        node.innerHTML = (items.useMinutes ? omniToggl.money.toFixed(2) : omniToggl.money) + items.currencyCharacter + '  ' + chrome.i18n.getMessage('thisWeek');
        
        parentElm.appendChild(node);

        var days = document.querySelectorAll('.date-container .super');
        for (var i= 0; i < days.length; i++) {
            var split = days[i].innerText.split('h');
            if (split.length === 2) {
                var money = parseInt(split[0], 10);
                if (items.useMinutes) {
                    money = money + parseInt(split[1], 10) / 60;
                }
                money = items.hourlyWage * money;
                days[i].innerText = split[0] + ':' + split[1] + ' ' + items.currencyCharacter + '  ' + money.toFixed(2);
            }
        }
    },
    liveMoney: function liveMoney(items) {
        var loop = function() {
            if (window.location.href !== 'https://www.toggl.com/app/timer') {
                return;
            }
            var currentInput = document.querySelector(omniToggl.liveTimeSelector).value;
            var time = {
                secs:'',
                min:'',
                hour:''
            };
            var data = currentInput.split(':');
            var totalTime = 0;
            if (currentInput.indexOf('min') !== -1) {
                time.min = data[0];
                time.secs = data[1];
                totalTime = parseInt(time.min,10) * 60 + parseInt(time.secs, 10);
            }
            if (currentInput.indexOf('sec') !== -1) {
                time.secs = data[0];
                totalTime = parseInt(time.secs, 10);
            }
            if (data.length === 3) {
                time.hour = data[0];
                time.min = data[1];
                time.secs = data[2];
                totalTime = parseInt(time.hour,10) * 3600 + parseInt(time.min,10) * 60 + parseInt(time.secs, 10);
            }
            if (data.length < 4) {

                var secondly = items.hourlyWage / 3600;
                var money = secondly * totalTime;
                var node = document.querySelector('.liveMoney');
                if (node === null) {
                    node = document.createElement('div');
                }
                node.className = 'liveMoney';
                node.innerHTML = items.currencyCharacter + '  ' + money.toFixed(2);
                document.querySelector('.date-time-container-container').appendChild(node);
            }
            requestAnimationFrame(loop);
        };
        setTimeout(loop, 1000);

    },
    omniTrack: function omniTrack(items) {
        omniToggl.observeOmniTrack = new MutationObserver(function (mutations) {

            mutations.forEach(function (mutation) {
                if (mutation.target.innerText !== undefined) {
                    var split = mutation.target.innerText.split(':');

                    if (split.length === 2) {
                        var money = parseInt(split[0],10);
                        if (items.useMinutes) {
                            money = money + parseInt(split[1], 10)/60;
                        }
                        money = items.hourlyWage * money;
                        mutation.target.innerText = mutation.target.innerText + '  ' + items.currencyCharacter + '  ' + money.toFixed(2);
                    }
                }
            });
        });
    },
    startOmniTrack: function() {
        chrome.storage.sync.get({
            hourlyWage: 1,
            useMinutes: false,
            currencyCharacter: '$'
        }, omniToggl.omniTrack);
    }
};

omniToggl.init();