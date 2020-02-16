/**
 * Created by Administrator on 2020/2/14 0014.
 */
/* Magic Mirror
 * Module: NCP-city

 * @property {number} appid - API access key for https://tianqiapi.com/user to register.
 * @property {string} appsecret - API access key for https://tianqiapi.com/user to register.
 * @property {string} version - Fixed value for https://tianqiapi.com/user(Each interface has a different version value).
 */
/* global Module */



Module.register("NCPcity-shanghai",{

    defaults: {
        appid: "",
        appsecret:"",
        units: config.units,
        maxNumberOfLists: 10,
        updateInterval: 60 * 60 * 1000, // every 60 minutes
        timeFormat: config.timeFormat,
        lang: config.language,
        colored: false,
        scale: false,
        header:"",
        animationSpeed: 1000,
        initialLoadDelay: 2500, // 2.5 seconds delay. This delay is used to keep the API happy.
        retryDelay: 2500,
        version: "epidemic",//Fixed value
        apiBase: "https://tianqiapi.com/api",

        appendLocationNameToHeader: true,
        tableClass: "small"
    },

    // create a variable to hold the location name based on the API result.
    fetchedLocationName: "",

    // Define required scripts.
    getScripts: function() {
        return ["moment.js"];
    },

    // Define required scripts.
    getStyles: function() {
        return [ "NCPcity-shanghai.css"];
    },

    // Define required translations.
    getTranslations: function() {
        // The translations for the default modules are defined in the core translation files.
        // Therefor we can just return false. Otherwise we should have returned a dictionary.
        // If you're trying to build your own module including translations, check out the documentation.
        return false;
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);
        // Set locale.
        moment.locale(config.language);
        this.shanghai=[];
        this.loaded = false;
        this.scheduleUpdate(this.config.initialLoadDelay);  //需要改
        this.updateTimer = null;
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");
        if (this.config.appid === "" || this.config.appsecret==="") {
            wrapper.innerHTML = "Please set the correct appid(or appsecret) in the config for this module ";
            wrapper.className = "dimmed light small";
            return wrapper;
        }
        if (!this.loaded) {
            wrapper.innerHTML = this.translate("Loading...");
            wrapper.className = "dimmed bright small";
            return wrapper;
        }

        var table = document.createElement("table");
        table.className = this.config.tableClass;
        for (var a=0;a<this.shanghai.length-1;a++) {
            var tr = document.createElement("tr");
            if (this.config.colored) {
                tr.className = "colored";
            }
            table.appendChild(tr);

            var areaCell = document.createElement("td");
            areaCell.className = "font";
            areaCell.innerHTML=this.shanghai[a].cityName;
            tr.appendChild(areaCell);

            var confirmedCell = document.createElement("td");
            confirmedCell.className = "font";
            confirmedCell.innerHTML=this.shanghai[a].confirmedCount;
            tr.appendChild(confirmedCell);
        }
        return table;
    },

    /*Override getHeader method*/
    //getHeader: function() {
    //    this.config.header.className="bright";
    //    return this.config.header;
    //},

    /* Override notification handler.*/
    notificationReceived: function(notification, payload, sender) {
        if (notification === "DOM_OBJECTS_CREATED") {
            if (this.config.appendLocationNameToHeader) {
                this.hide(0, {lockString: this.identifier});
            }
        }
    },

    /*  NCPRequest(compliments)
     * Requests new data from api.
     * Calls processData on successful response.
     */
    NCPRequest: function() {
        if (this.config.appid === "") {
            Log.error(" appid not set!");
            return;
        }
        var self=this;
        var url = this.config.apiBase + this.getParams() ;
        console.log(url);
        var Request = new XMLHttpRequest();
        Request.open("GET", url, true);
        Request.onreadystatechange = function() {
            if (this.readyState === 4  && this.status === 200) {
                console.log(JSON.parse(this.response));
                self.processData(JSON.parse(this.response));
            }
        };
        Request.send();
    },

    /* getParams(compliments)
     * Generates an url with api parameters based on the config.
     *
     * return String - URL params.
     */
    getParams: function() {
        var params = "?";
        console.log(this.config.version);
        if(this.config.version) {
            params += "version=" + this.config.version;
        } else if(this.config.appid) {
            params += "appid=" + this.config.appid;
        } else if (this.config.appid) {
            params += "appsecret=" + this.config.appsecret;
        }else {
            this.hide(this.config.animationSpeed, {lockString:this.identifier});
            return;
        }

        params += "&appid=" + this.config.appid;
        params += "&appsecret=" + this.config.appsecret;

        return params;
    },

    /* processWeather(data)
     * Uses the received data to set the various values.使用接收到的数据设置各种值。
     *
     * argument data object - Weather information received form openweather.org.
     */
    processData: function(data) {
        this.shanghai=[];
        var datalist=data.data.area;
        var shanghaiList=datalist.filter(function(item){
            return item.provinceName=="上海"
        });
        console.log(shanghaiList);
        var area=shanghaiList[0].cities;
        for(var a=0;a<area.length;a++){
            this.shanghai.push(area[a]);
        }
        var shanghaititle={
            cityName:"区域",
            confirmedCount:"确诊"
        };
        this.shanghai.unshift(shanghaititle);
        console.log(this.shanghai);
        this.show(this.config.animationSpeed, {lockString:this.identifier});
        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
    },

    /* scheduleUpdate()
     * Schedule next update.
     *
     * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
     */
    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(function() {
            self.NCPRequest();
        }, nextLoad);
    }
});
