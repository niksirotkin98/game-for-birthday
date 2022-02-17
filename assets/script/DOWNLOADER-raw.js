/* Downloader Class */
function ASSET_DOWNLOADER(origin, type, data, downloader, log = false, version = "1"){

    this.start = function(){
        for (let key in this.data) {
            if (key == "length") {continue;}
            let value = this.data[key];
            value.src = this.origin + value.src + "?v=" + this.version;
            this.downloadFunc(key, value, this.loadEnd, this.loadEnd);
        }
        return this;
    }
    this.loadEnd = function(event){
        if (event.type === 'load') {
            this.count++;
            this.downloader.count++;
            this.downloader.addLoadedData(this.type, event.currentTarget);
        } else {
            this.errors++;
            this.downloader.errors++;
            event.currentTarget.remove();
        }

        this.downloader.update(event.type === 'load');

        if ((this.count + this.errors) === this.max) {
            if (this.log){
                console.log(`All ${this.type} downloaded(${Math.ceil((this.count / this.max) * 100)}%)`);
            }
            this.downloader.onLoad(this.type, this.count, this.max);
        }
    }

    this.origin = origin;
    this.version = version;
    this.data = data;
    this.type = type;
    this.downloader = downloader;
    this.downloadFunc = this.downloader.getDownloadFunc(this.type);
    this.log = log;

    this.count = 0;
    this.errors = 0;
    this.max = this.data.length;
    this.loaded = [];
    this.loadEnd = this.loadEnd.bind(this);

    return this;
}
function DOWNLOADER(origin, url, log = false, version = "1") {
    /*
        images -> [<image1_address>, <image2_address>, ... , <imageN_address>]
        styles -> [<style1_address>, <style2_address>, ... , <styleN_address>]
        fonts -> [<font1_obj>, <font2_obj>, ... , <fontN_obj>] when obj -> { family: <font_family>, src: 'url(<font_src>)'}

        start - start download images, styles and fonts in one moment
        update - function called on every load event, example - 50 files = 50 update calls
        loadEnd - call when all data in one type(ex. images) are downloaded
     */
    console.log(`Downloader(${origin}, ${url})`);

    this.setUpdate = function(method){
        this.updateListener = method;
        return this;
    }
    this.setOnLoadMainJSON = function(method){
        this.onLoadMainJSONListener = method;
        return this;
    }
    this.setOnLoad = function(method){
        this.onLoadListener = method;
        return this;
    }
    this.setOnLoadJSON = function(method){
        this.onLoadJSONListener = method;
        return this;
    }
    this.setOnLoadSCRIPT = function(method){
        this.onLoadSCRIPTListener = method;
        return this;
    }
    this.setOnLoadIMAGE = function(method){
        this.onLoadIMAGEListener = method;
        return this;
    }
    this.setOnLoadSTYLE = function(method){
        this.onLoadSTYLEListener = method;
        return this;
    }
    this.setOnLoadFONT = function(method){
        this.onLoadFONTListener = method;
        return this;
    }
    this.setOnAllLoad = function(method){
        this.onAllLoadListener = method;
        return this;
    }

    this.update = function(load){
        if (this.all_count == 0){
            return this.mainJSONloaded;
        }
        this.status = this.mainJSONloaded + 0.95 * (this.count / this.all_count);
        this.updateListener(this.status);
    }
    this.onLoadMainJSON = function(){
        this.mainJSONloaded = 0.05;
        this.data = {
            image : { ...this.json.download.image, length : this.getLength(this.json.download.image) },
            font : { ...this.json.download.font, length : this.getLength(this.json.download.font) },
            json : { ...this.json.download.json, length : this.getLength(this.json.download.json) },
            style : { ...this.json.download.style, length : this.getLength(this.json.download.style) },
            script : { ...this.json.download.script, length : this.getLength(this.json.download.script) }
        };
        this.all_count = this.data.image.length + this.data.font.length + this.data.json.length + this.data.style.length + this.data.script.length;
        this.onLoadMainJSONListener(this.json);

        if (this.startedOnce == true){
            this.start();
        }
    }
    this.onLoad = function(type, count, needed){
        this.onLoadListener(type, this.loaded[type], count, needed);
        switch (type){
            case "image":
                this.onLoadIMAGE(count, needed);
                break;
            case "font":
                this.onLoadFONT(count, needed);
                break;
            case "json":
                this.onLoadJSON(count, needed);
                break;
            case "script":
                this.onLoadSCRIPT(count, needed);
                break;
            case "style":
                this.onLoadSTYLE(count, needed);
                break;
        }

        if ((this.count + this.errors) === this.all_count) {
            this.endTime = new Date();
            this.loadTime = this.endTime - this.startTime;
            this.allLoaded = true;

            this.onAllLoad();

            if (this.log){
                console.log(`All downloaded(${Math.ceil((this.count / this.all_count) * 100)}%)`);
            }
        }
        return this;
    }
    this.onLoadJSON = function(count, needed){
        this.onLoadJSONListener(this.loaded.json ,count, needed);
        return this;
    }
    this.onLoadSCRIPT = function(count, needed){
        this.onLoadSCRIPTListener(this.loaded.script ,count, needed);
        return this;
    }
    this.onLoadIMAGE = function(count, needed){
        this.onLoadIMAGEListener(this.loaded.image ,count, needed);
        return this;
    }
    this.onLoadSTYLE = function(count, needed){
        this.onLoadSTYLEListener(this.loaded.style ,count, needed);
        return this;
    }
    this.onLoadFONT = function(count, needed){
        this.onLoadFONTListener(this.loaded.font ,count, needed);
        return this;
    }
    this.onAllLoad = function(){
        this.onAllLoadListener(
            this.loaded,
            this.loadTime,
            this.status
        );
        return this;
    }

    this.updateListener = function(status){}
    this.onLoadMainJSONListener = function(data){}
    this.onLoadListener = function(type, data, count, needed){}
    this.onLoadJSONListener = function(data, count, needed){}
    this.onLoadSCRIPTListener = function(data, count, needed){}
    this.onLoadIMAGEListener = function(data, count, needed){}
    this.onLoadSTYLEListener = function(data, count, needed){}
    this.onLoadFONTListener = function(data, count, needed){}
    this.onAllLoadListener = function(data, loadTime, status){}

    this.startMainJSON = function(){
        fetch(this.url + "?v=" + this.version)
            .then(r=>r.json())
            .then(json=>{
                this.json = json;
                this.onLoadMainJSON();
            })
            .catch(e=>{
                console.error(e);
            })
    }
    this.startJSON = function(){
        this.assetDownloaders.json = new ASSET_DOWNLOADER(
            this.origin + this.json.download.path.json,
            "json",
            this.data.json,
            this,
            this.log,
            this.version
        );
        this.assetDownloaders.json.start();
    }
    this.startSCRIPT = function(){
        this.assetDownloaders.script = new ASSET_DOWNLOADER(
            this.origin + this.json.download.path.script,
            "script",
            this.data.script,
            this,
            this.log,
            this.version
        );
        this.assetDownloaders.script.start();
    }
    this.startSTYLE = function(){
        this.assetDownloaders.style = new ASSET_DOWNLOADER(
            this.origin + this.json.download.path.style,
            "style",
            this.data.style,
            this,
            this.log,
            this.version
        );
        this.assetDownloaders.style.start();
    }
    this.startFONT = function(){
        this.assetDownloaders.font = new ASSET_DOWNLOADER(
            this.origin + this.json.download.path.font,
            "font",
            this.data.font,
            this,
            this.log,
            this.version
        );
        this.assetDownloaders.font.start();
    }
    this.startIMAGE = function(){
        this.assetDownloaders.image = new ASSET_DOWNLOADER(
            this.origin + this.json.download.path.image,
            "image",
            this.data.image,
            this,
            this.log,
            this.version
        );
        this.assetDownloaders.image.start();
    }

    this.start = function(){
        if(!this.startedOnce){
            if(typeof this.url != 'string'){
                this.startedOnce = true;
                this.json = this.url;
                this.onLoadMainJSON();
                return false
            } else if (!this.json){
                this.startedOnce = true;
                this.startMainJSON();
                return false;
            }
        }
        this.loaded = {
            image : {},
            font : {},
            style : {},
            json : {},
            script : {}
        };
        this.assetDownloaders = {};
        this.startTime = new Date();
        this.startJSON();
        this.startSCRIPT();
        this.startSTYLE();
        this.startFONT();
        this.startIMAGE();
        return true;
    }

    this.getDownloadFunc = function(type){
        switch (type){
            case 'image': return this.imageDownload;
            case 'style': return  this.styleDownload;
            case 'font': return  this.fontDownload;
            case 'json': return  this.jsonDownload;
            case 'script': return  this.scriptDownload;
        }
        return;
    }
    this.addLoadedData = function(type, value){
        let key = value.dataset.key;
        switch (type){
            case 'image':
                this.loaded.image[key] = value;
                return true;
            case 'style':
                this.loaded.style[key] = value;
                return true;
            case 'font':
                this.loaded.font[key] = value.data;
                return true;
            case 'json':
                this.loaded.json[key] = value.data;
                return true;
            case 'script':
                this.loaded.script[key] = value.data;
                return true;
        }
        return false;
    }
    this.getLength = function(obj){
        let i = 0;
        for (let key in obj){
            i++;
        }
        return i;
    }

    this.imageDownload = function(key, {src}, resolve, reject) {
        let img = document.createElement('img');
        img.dataset.key = key || ("unknown" + (++this.unknown));

        img.addEventListener('load', resolve);
        img.addEventListener('error', reject);

        img.setAttribute('src', src);
    }
    this.scriptDownload = function(key, {src}, resolve, reject){
        let finded = document.querySelector('script[data-downloader-key="' + key + '"]');
        if (finded){
            resolve({type : 'load', currentTarget : finded});
            return;
        }

        let script = document.createElement('script');
        script.dataset.key = key || ("unknown" + (++this.unknown));

        document.body.appendChild(script);

        script.addEventListener('load', resolve);
        script.addEventListener('error', reject);

        script.dataset.downloaderKey = key;
        script.setAttribute('defer', true);
        script.setAttribute('src', src);
    }
    this.styleDownload = function(key, {src, className}, resolve, reject){
        let finded = document.querySelector('link[data-downloader-key="' + key + '"]');
        if (finded){
            resolve({type : 'load', currentTarget : finded});
            return;
        }

        let link = document.createElement('link');
        link.dataset.key = key || ("unknown" + (++this.unknown));

        document.head.appendChild(link);

        link.addEventListener('load', resolve);
        link.addEventListener('error', reject);

        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.media = 'all';
        link.dataset.downloaderKey = key;
        link.href = src;
        console.log(key, src);
    }
    this.fontDownload = function(key, fontData, resolve, reject){
        let font = new FontFace(fontData.family, `url(${fontData.src})`);
        if (fontData.weight){
            font.weight = fontData.weight;
        }

        font.load().then(function(loadedFont) {
            document.fonts.add(loadedFont);
            resolve({type: "load", currentTarget: {data: loadedFont, dataset: {key: key || ("unknown" + (++this.unknown))}}});
        }).catch(function(error) {
            resolve({type: "error", currentTarget: {remove:()=>{}}, error: error});
        });
    }
    this.jsonDownload = function(key, {src}, resolve, reject){
        fetch(src)
            .then(r=>r.json())
            .then(j=>{
                resolve({type: "load", currentTarget: {data: j, dataset: {key: key || ("unknown" + (++this.unknown))}}});
            })
            .catch(e=>{
                resolve({type: "error", currentTarget: {remove:()=>{}}, error: error});
            });
    }

    this.origin = origin;
    this.url = url;
    this.version = version;

    this.log = log;
    this.allLoaded = false;
    this.all_count = 0;
    this.count = 0;
    this.errors = 0;
    this.startTime = 0;
    this.endTime = 0;
    this.unknown = 1;

    this.loadTime = false;
    this.status = 0;
    this.startedOnce = false;
    this.mainJSONloaded = 0;

    return this;
}

function SetNormalSources(origin, array){
    for(let i = 0; i < array.length; i++){
        if (typeof array[i] === "string") {
            array[i] = {src : origin + array[i]};
        } else {
            array[i].src = origin + array[i].src;
        }
    }
    return array;
}