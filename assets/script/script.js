let DATA = null,
    STRUCT = null,
    downloader = new DOWNLOADER(
    window.location.origin + window.location.pathname,
    window.location.origin + window.location.pathname + 'assets/json/data.json',
    true,
    "release2");
    
function ImageReplacer(element = document.body){
    let changes = element.querySelectorAll('imgrep');
    for (let i of changes){
        try{
            let image = DATA.image[i.innerText].cloneNode();
            image.classList.value = i.classList.value;
            i.insertAdjacentElement("afterend", image);
            i.remove();
            console.log("ImageReplacer: replace '" + i.innerText + "'.");
        }
        catch (e){
            console.error(e);
        }
    }
}

downloader.setUpdate((status)=>{
    //console.clear();
    console.log(Math.ceil(status * 100) + "%");
});
downloader.setOnLoadMainJSON((json)=>{
    STRUCT = json;
});
downloader.setOnAllLoad((data)=>{
    DATA = data;
    console.log(data);

    init();
})
downloader.start();

function Game(data, key){
    this.key = key;
    this.secret = data.secret;
    this.openDelay = 50;
    this.closeDelay = 1100;

    this.title = data.title;
    this.descr = data.descr;

    this.root = document.createElement('div');
    this.root.className = "frame";
    this.root.style.setProperty("display", "none");
    document.body.append(this.root);

    this.show = function(){
        this.root.style.removeProperty("display");
        if(this.controlPanel){
            this.controlPanel.style.removeProperty("display");
        }
        setTimeout(()=>{
            this.root.classList.add("active");
        }, this.openDelay);
    }
    this.close = function(){
        this.root.classList.remove("active");
        if(this.controlPanel){
            this.controlPanel.style.setProperty("display", "none");
        }
        setTimeout(()=>{
            this.root.style.setProperty("display", "none");
        }, this.closeDelay);
    }

    this.onStart = function(){}
    this.start = function(){
        app.background.innerHTML = "";
        app.middleLayer.className = "";
        app.title.innerHTML = this.title;
        app.descr.innerHTML = this.descr;
        app.secret[this.key].classList.add("active");
        app.secret[this.key].classList.remove("unknown");
        this.onStart();
        this.show();
    };
    this.update = function(){};
    this.onEnd = function(){};
    this.end = function(){
        app.background.innerHTML = "";
        app.middleLayer.className = "";
        app.secret[this.key].classList.remove("active");
        app.secret[this.key].classList.remove("unknown");
        app.secretCode += this.secret;
        app.secret[this.key].querySelector("span").innerHTML = this.secret;
        this.close();
        this.onEnd();
    }
    this.gameOver = function(){
        app.background.innerHTML = "";
        app.middleLayer.className = "";
        app.secret[this.key].classList.remove("active");
        app.secret[this.key].classList.add("unknown");
        this.close();
        this.onGameOver();
    }
    this.onGameOver = function(){}

    this.replay = function(){};
    this.init = function(){};

    return this;
}

function SwordTurnCard(ground, system, direction = 0, correct = 0, image = "sword1"){
    this.correct = correct;
    this.direction = direction;
    this.ground = ground;
    this.image = image;
    this.system = system;
    this.link = [];

    this.addLink = function(card){
        this.link.push(card);
        return this;
    }
    this.check = function(){ 
        if(this.correct == this.direction){
            this.root.classList.add("correct");
        } else {
            this.root.classList.remove("correct");
        }
    }
    this.draw = function(){
        this.root.className = (this.root.className + "").replace(/dir\d/gm, "");
        this.root.classList.add("dir"+ this.direction);
    }
    this.rotate = function(initiator = true){
        this.direction = this.direction + 1 < 4? this.direction + 1: 0;

        this.draw();
        this.check();

        if(initiator){
            for(let n of this.link){
                n.rotate(false);
            }
        }
    }

    this.root = document.createElement("div");
    this.root.classList.add("sword-turn-card");
    this.root.innerHTML = `
        <div class="sword-turn-effect"></div>
        <imgrep>${this.image}</imgrep>
    `;
    this.root.addEventListener("click", (e)=>{
        this.rotate();
        this.system.check();
    });
    ImageReplacer(this.root);

    this.ground.append(this.root);
    this.draw();
    this.check();

    return this;
}

function SwordTurn(data, key){
    this.__proto__ = new Game(data, key);

    this.root.classList.add("sword-turn");

    this.firstTime = true;
    this.cards = [];
    this.scripts = data.script;
    this.startFrom = data.start;

    this.onEnd = function(){
        app.next();
        //app.menu.show();
    }
    this.check = function(){
        let correct = true;
        for(let n of this.cards){
            correct = n.correct == n.direction? correct: false;
        }
        if(correct){
            setTimeout(()=>{
                this.end();
            }, 2500);
        }
    }
    this.onStart = function(){
        app.background.className = "sword-turn-back";

        this.root.innerHTML = "";
        this.cards = [];

        let script = this.startFrom;
        /*if(this.firstTime){
            script = Math.ceil(Math.random() * (this.scripts.length - 1));
        }*/
        script = this.scripts[script];
        for(let c of script){
            let card = new SwordTurnCard(
                this.root,
                this,
                c.direction, 
                c.correct, 
                c.image
            );

            this.cards.push(card);
        }

        for(let c in script){
            for(let l of script[c].link){
                this.cards[c].addLink(this.cards[l]);
            }
        }

        this.firstTime = false;
    }

    return this;
}

function UnderwaterSignCard(signId, signImage, signKey, system){
    this.hidden = false;
    this.correct = false;
    this.active = true;
    this.id = signId;
    this.sign = {
        key : signKey,
        image : signImage,
    }
    this.system = system;

    this.open = function(){};
    this.onPress = function(){
        if(this.active == false && this.correct == false){
            if(this.hidden == false){
                this.hidden = true;
                this.draw();
            }
            else
            {
                this.hidden = false;
                this.active = true;
                this.draw();
                this.system.setActiveCard(this);
            }
        } 
    }
    this.draw = function(){
        if(this.correct == false){
            if(this.hidden == true){
                this.root.classList.add("hidden");
                this.root.classList.remove("active");
                this.root.classList.remove("correct");
            } else {
                this.root.classList.add("active");
                this.root.classList.remove("hidden");
                this.root.classList.remove("correct");
            }
        }
        else
        {
            this.root.classList.add("correct");
            this.root.classList.remove("hidden");
            this.root.classList.remove("active");
        }
    }


    this.root = document.createElement("div");
    this.root.className = "underwater-sign-card";
    this.root.innerHTML = `
        <div class="underwater-sign-effect"></div>
        <imgrep class="underwater-sign-hidden">button</imgrep>
        <imgrep class="underwater-sign-pressed">button_pressed</imgrep>
        <imgrep class="underwater-sign-sign">${this.sign.image}</imgrep>
    `;
    system.root.appendChild(this.root);
    ImageReplacer(this.root);

    this.button = document.createElement("div");
    this.button.className = "button";
    this.button.addEventListener("click", ()=>{
        console.log(this.sign.key)
        this.onPress();
    })
    system.controlPanel.appendChild(this.button);

    this.draw();
}

function UnderwaterSign(data, key){
    this.__proto__ = new Game(data, key);

    this.root.classList.add("underwater-sign");

    this.controlPanel = document.createElement("div");
    this.controlPanel.className = "control-panel underwater-sign";
    this.controlPanel.style.setProperty("display", "none");
    document.body.append(this.controlPanel);

    
    app.middleLayer.innerHTML = `
        <div class="underwater-sign-wave">
            <div class="wave"></div>
            <div class="deep"></div>
        </div>
    `;

    this.cards = [];
    this.solveTime = data.solveTime * 1000;
    this.memorizeTime = data.memorizeTime * 1000;
    this.scripts = data.script;
    this.startFrom = data.start;
    this.correct = 0;
    
    this.ScriptGenerator = function(){
        let script = {
            
        }
    }

    this.setActiveCard = function(card){
        if(this.activeCard){
            let card2 = this.activeCard;
            if(card.sign.key == card2.sign.key){
                card2.correct = true;
                card.correct = true;
                this.correct++;
            } else {
                card2.correct = false;
                card2.hidden = true;
                card2.active = false;
                card.correct = false;
                card.hidden = true;
                card.active = false;
            }
            this.activeCard = null;
            setTimeout(()=>{
                card2.draw();
                card.draw();
                if(this.correct == 4){
                    setTimeout(()=>{
                        this.end();
                    }, 500);
                }
            }, 250);
        } else {
            this.activeCard = card;
        }
    }
    this.getActiveCard = function(){
        let card = this.activeCard;
        this.activeCard = null;
        return card;
    }

    this.onStart = function(){
        app.background.className = "underwater-sign-back";
        app.middleLayer.classList.add("underwater-sign-wave-layer")

        this.controlPanel.innerHTML = "";
        this.root.innerHTML = "";

        
        let script = this.startFrom;
        /*if(this.firstTime){
            script = Math.ceil(Math.random() * (this.scripts.length - 1));
        }*/
        script = this.scripts[script];

        for(let i = 0; i < script.length; i++){
            this.cards.push(new UnderwaterSignCard(i, script[i].image, script[i].key, this));
        }
        
        this.wave = app.middleLayer.querySelector(".underwater-sign-wave")
        this.waveHeight = 0;
        this.time = 0;

        setTimeout(()=>{
            this.wave.classList.add("clear");
        }, 100)
        setTimeout(()=>{
            for(let c of this.cards){
                c.active = false;
                c.hidden = true;
                c.draw();
            }
            this.waveInterval = setInterval(()=>{
                this.time += 100;
                if(this.time >= this.solveTime){
                    clearInterval(this.waveInterval);
                    this.wave.style.setProperty("top", `${-10}vh`);
                    this.gameOver();
                    return;
                }
                this.waveHeight = (1 - this.time / this.solveTime) * 100;
                this.wave.style.setProperty("top", `${this.waveHeight}vh`);
            }, 50);
        }, this.memorizeTime + 100);
    }
    this.onEnd = function(){
        clearInterval(this.waveInterval);
        setTimeout(()=>{
            app.middleLayer.innerHTML = "";
            app.next();
        }, 2500);
    }
    this.onGameOver = function(){
        clearInterval(this.waveInterval);
        setTimeout(()=>{
            app.gameOver(this.key);
        }, 2500);
    }

    return this;
}

function RaceCar(position, top, road, step, image = "car2"){
    this.position = position;
    this.top = top * step;
    this.y = top;
    this.root = DATA.image[image].cloneNode();
    this.root.classList.add("race-col-" + this.position);
    this.root.style.setProperty("bottom", this.top + "%");

    road.appendChild(this.root);

    return this;
}

function Race(data, key){
    this.__proto__ = new Game(data, key);

    this.root.classList.add("race");
    this.root.innerHTML = `
        <div class="race-display-container">
            <imgrep>display</imgrep>
            <div class="race-distance">
                <imgrep>timebar</imgrep>
            </div>
            <div class="race-display">
                <div class="race-road">
                </div>
                <imgrep class="race-col-2 race-test-2 race-player">car1</imgrep>
            </div>
            <div class="race-health-bar">
            </div>
        </div>
        <div class="race-control-panel">
            <div class="race-left">
                <imgrep class="race-button">button_go_left</imgrep>
                <imgrep class="race-button-pressed">button_go_left_pressed</imgrep>
            </div>
            <div class="race-rigth">
                <imgrep class="race-button">button_go_right</imgrep>
                <imgrep class="race-button-pressed">button_go_right_pressed</imgrep>
            </div>
        </div>
    `;
    ImageReplacer(this.root);
    this.buttonLeft = this.root.querySelector(".race-left");
    this.buttonRight = this.root.querySelector(".race-rigth");
    this.playerCar = this.root.querySelector(".race-player");
    this.heart = this.root.querySelector(".race-health-bar");
    this.road = this.root.querySelector(".race-road");
    this.distance = this.root.querySelector(".race-distance");

    this.timers = {};
    this.scripts = data.script;
    this.startFrom = data.start;
    this.step = 100;
    this.dumpBuffer = 0.5;
    this.invisibulityTime = 1500;
    this.drawRate = 50;
    this.maxHP = data.hp;
    this.maxTime = data.time * 1000;
    this.speedMultiplier = data.speedMultiplier;

    this.buttonLeft.addEventListener("click", ()=>{
        if(this.pauseState == false){
            this.turn(-1);
        }
        this.buttonLeft.classList.add("active");
        this.draw();
        setTimeout(()=>{
            this.buttonLeft.classList.remove("active");
        }, 100);
    })
    this.buttonRight.addEventListener("click", ()=>{
        if(this.pauseState == false){
            this.turn(1);
        }
        this.buttonRight.classList.add("active");
        this.draw();
        setTimeout(()=>{
            this.buttonRight.classList.remove("active");
        }, 100);
    })


    this.draw = function(){
        this.playerCar.className = "race-player race-col-" + this.playerPosition + " " + (this.invisible == true? "invisible": "");
    }
    this.play = function(){
        this.pauseState = false;
        this.timers.road = setInterval(()=>{
            this.checkForward();
            //console.log(this.roadY, this.speed);
            this.time += this.drawRate;
            if(this.time >= this.maxTime){
                this.pause();
                this.end();
                return;
            }
            let estimated = Math.ceil((1 - (this.time / this.maxTime)) * 10) / 10;
            this.distance.style.setProperty("width", `${estimated * 84}%`);
            console.log(`tiem:${this.time} estimated:${estimated} top:${this.roadY} speed:${this.speed} real:${this.y}`)
        },
        this.drawRate)
    }
    this.pause = function(){
        this.pauseState = true;
        clearInterval(this.timers.road);
    }
    this.turn = function(side){
        let newPosition = this.playerPosition + (this.playerPosition == (side == 1? 3: 1)? 0: side);
        let dump = false;

        for(let c of this.carColumns[newPosition]){
            if(this.y >= c.y - 1 && this.y <= c.y + 0.8){
                dump = true;
                break;
            }
            if(c.y > this.y) break;
        }
        dump = this.invisible == true? false: dump;
        if(dump == true){
            this.dump();
        } else {
            this.playerPosition = newPosition;
        }
    }
    this.checkForward = function(){
        let newY = this.y + this.realSpeed;
        let dump = false;
        for(let c of this.carColumns[this.playerPosition]){
            if(newY >= c.y - 1 && newY <= c.y){
                dump = true;
                break;
            }
            if(c.y > this.y) break;
        }

        dump = this.invisible == true? false: dump;
        if(dump == true){
            this.dump();
        } else {
            this.roadY += this.speed;
            this.y = this.roadY * 0.03825;
            this.speed += this.speedMultiplier;
            this.realSpeed = this.speed * 0.03825;
            this.road.style.setProperty("bottom", `-${this.roadY}%`);
        }
    }
    this.dump = function(){
        if(this.invisible == false){
            this.hp--;
            this.invisible = true;
            if(this.hp == 0){
                this.pause();
                this.gameOver();
                return;
            }
            this.draw();
            setTimeout(()=>{
                this.invisible = false;
                this.draw();
            }, this.invisibulityTime);
            let heart = this.heart.querySelector("img:last-child");
            if(heart){
                heart.remove();
            }
        }
    }

    this.onStart = function(){
        app.background.className = "race-back";

        this.carColumns = [
            0,
            [],
            [],
            []
        ];
        this.pauseState = true;
        this.invisible = false;
        this.playerPosition = 2;
        this.speed = 5;
        this.realSpeed = this.speed * 0.03825;
        this.roadY = 0;
        this.time = 0;
        this.hp = this.maxHP;
        this.y = 0;

        this.heart.innerHTML = "";
        for(let i = 0; i < this.hp; i++){
            this.heart.innerHTML += "<imgrep>heart</imgrep>";
        }
        ImageReplacer(this.heart);

        let script = this.startFrom;
        /*if(this.firstTime){
            script = Math.ceil(Math.random() * (this.scripts.length - 1));
        }*/
        script = this.scripts[script];
        let f = (c, i)=>{
            let car;
            if(c == 4 || c == 5 || c == 6){
                car = new RaceCar(c - 3, i, this.road, this.step, "car3")
            }
            else{
                car = new RaceCar(c, i, this.road, this.step)
            }
            this.carColumns[car.position].push(car);
            this.carColumns[0]++;
        }
        for(let i = 0; i < script.length; i++){
            let car = script[i];
            if(car === 0) continue;
            if(typeof(car) == "number"){
                f(car, i);
            } else {
                for(let j of car){
                    f(j, i)
                }
            }
        }

        this.draw();
        this.play();
    }
    this.onEnd = function(){
        if(this.timers.road){
            this.pause();
        }
        setTimeout(()=>{
            app.next();
        }, 2500);
    }
    this.onGameOver = function(){
        if(this.timers.road){
            this.pause();
        }
        setTimeout(()=>{
            app.gameOver(this.key);
        }, 2500)
    }

    return this;
}

function RockPaperScissors(data, key){
    this.__proto__ = new Game(data, key);
    
    this.root.classList.add("rock-paper");

    this.replics = [
        ["Готов?", "Камень, ...", "ножницы, ...", "бумага!", ["Ща отыграюсь!", "Хе, не повезло<br>тебе)", "Ничья(", "Моя победа!"]],
        ["Второй раунд?", "Кама, ножа, бумажа...", "три ...", "бомжа!", ["Ну ты и с*%&!", "Ну что,<br>рещающую?", "Тьфу!", "Играть не хочешь?"]],
        ["Ну ещё одна(", "Раз!", "Два!", "Три!", ["Устал я...", "На!", "Рыба...", "Соберись!"]]
    ]

    this.getCompChoice = function(choice){
        if(choice){
            return choice;
        }
        return Math.ceil(Math.random()*3);
    }
    this.setPlayerChoice = function(choice){
        this.playerChoice = choice;
        this.mesPlayer.className = "rock-paper-mes-player " + this.getSign(this.playerChoice);
    }
    this.prepare = function(){
        this.text.innerHTML = this.getReplic();

        this.rock.classList.remove("active");
        this.paper.classList.remove("active");
        this.scissor.classList.remove("active");
        this.mesComp.classList.remove("active");
        this.mesPlayer.classList.remove("active");

        this.canReady = true;
        this.ready.classList.add("active");
    }
    this.round = function(){
    }
    this.getSign = function(choice){
        switch(choice){
            case 1: return "rock";
            case 2: return "paper";
            case 3: return "scissor";
        }
        return "rock";
    }
    this.onReady = function(){
        this.canReady = false;
        this.rock.classList.add("active");
        this.paper.classList.add("active");
        this.scissor.classList.add("active");
        this.playerChoice = null;
        this.canChoice = true;
        this.compChoice = this.getCompChoice();
        this.mesComp.className = "rock-paper-mes-comp " + this.getSign(this.compChoice);

        this.ready.classList.remove("active");

        this.text.innerHTML = this.getReplic();
        setTimeout(()=>{
            this.text.innerHTML = this.getReplic();
        }, 1000);
        setTimeout(()=>{
            this.text.innerHTML = this.getReplic();
            this.result();
        }, 2000);
    }
    this.result = function(){
        this.mesComp.classList.add("active");
        if(!this.playerChoice){
            setTimeout(()=>{
                this.canChoice = false;
                this.rock.classList.remove("active");
                this.paper.classList.remove("active");
                this.scissor.classList.remove("active");
                this.mesPlayer.classList.add("active");
                this.check();
            }, 150);
        } else{
            this.canChoice = false;
            this.rock.classList.remove("active");
            this.paper.classList.remove("active");
            this.scissor.classList.remove("active");
            this.mesPlayer.classList.add("active");
            this.check();
        }
    }
    this.check = function(){
        let r;
        if(this.playerChoice == 1){
            if(this.compChoice == 1){
                r = 2;
            } else if(this.compChoice == 2){
                r = 1;
                this.stats.comp++;
            } else {
                r = 0;
                this.stats.player++;
            }
        } else if(this.playerChoice == 2){
            if(this.compChoice == 2){
                r = 2;
            } else if(this.compChoice == 3){
                r = 1;
                this.stats.comp++;
            } else {
                r = 0;
                this.stats.player++;
            }
        } else if(this.playerChoice == 3) {
            if(this.compChoice == 3){
                r = 2;
            } else if(this.compChoice == 1){
                r = 1;
                this.stats.comp++;
            } else {
                r = 0;
                this.stats.player++;
            }
        } else {
            r = 3;
            this.stats.comp++;
        }
        this.text.innerHTML = this.getReplic(r);
        if(this.stats.comp > 1 && this.stats.comp - this.stats.player > 1){
            this.winner = false;
            this.gameOver();
            return;
        } else if(this.stats.player > 1 && this.stats.player - this.stats.comp > 1){
            this.winner = true;
            this.end();
            return;
        } else {
            setTimeout(()=>{
                this.prepare();
            }, 2500);
        } 
    }
    this.getReplic = function(state){
        let replic = this.replics[this.currentReplicGroup][this.currentReplic];
        if(typeof(replic) != "string"){
            replic = replic[state];
        }
        this.currentReplic++;
        if(this.currentReplic == this.replics[this.currentReplicGroup].length){
            this.currentReplicGroup++;
            if(this.currentReplicGroup == this.replics.length){
                this.currentReplicGroup = 1;
            }
            this.currentReplic = 0;
        }
        return replic;
    }

    this.onStart = function(){
        app.background.className = "rock-paper-back";

        this.root.innerHTML = `
            <imgrep class="rock-paper-comp">comp</imgrep>
            <div class="rock-paper-comp-states state4">
                <imgrep class="rock-paper-comp-state-1">comp1</imgrep>
                <imgrep class="rock-paper-comp-state-2">comp2</imgrep>
                <imgrep class="rock-paper-comp-state-3">comp3</imgrep>
                <imgrep class="rock-paper-comp-state-4">comp4</imgrep>
            </div>
            <imgrep class="rock-paper-say">mes_comp_say</imgrep>
            <span class="rock-paper-say-text">Готов?</span>
            <div class="rock-paper-mes-comp">
                <imgrep class="rock-paper-res">mes_comp_res</imgrep>
                <imgrep class="rock-paper-rock">rpc_rock</imgrep>
                <imgrep class="rock-paper-paper">rpc_paper</imgrep>
                <imgrep class="rock-paper-scissor">rpc_scissor</imgrep>
            </div>
            <div class="rock-paper-mes-player">
                <imgrep class="rock-paper-res">mes_player_res</imgrep>
                <imgrep class="rock-paper-rock">rpc_rock</imgrep>
                <imgrep class="rock-paper-paper">rpc_paper</imgrep>
                <imgrep class="rock-paper-scissor">rpc_scissor</imgrep>
            </div>
            <div class="rock-paper-rock">
                <imgrep class="rock-paper-mes">mes_player1</imgrep>
                <imgrep class="rock-paper-sign">rpc_rock</imgrep>
            </div>
            <div class="rock-paper-paper">
                <imgrep class="rock-paper-mes">mes_player2</imgrep>
                <imgrep class="rock-paper-sign">rpc_paper</imgrep>
            </div>
            <div class="rock-paper-scissor">
                <imgrep class="rock-paper-mes">mes_player3</imgrep>
                <imgrep class="rock-paper-sign">rpc_scissor</imgrep>
            </div>
            <div class="rock-paper-ready active">
                <imgrep>ready</imgrep>
            </div>
        `;
        ImageReplacer(this.root);

        this.rock = this.root.querySelector("div.rock-paper-rock");
        this.paper = this.root.querySelector("div.rock-paper-paper");
        this.scissor = this.root.querySelector("div.rock-paper-scissor");

        this.mesComp = this.root.querySelector(".rock-paper-mes-comp");
        this.mesPlayer = this.root.querySelector(".rock-paper-mes-player");

        this.ready = this.root.querySelector(".rock-paper-ready");
        this.text = this.root.querySelector(".rock-paper-say-text");

        this.currentReplicGroup = 0;
        this.currentReplic = 0;
        this.stats = {
            player : 0,
            comp : 0
        }

        this.ready.addEventListener("click", ()=>{
            if(this.canReady == true)
                console.log("ready");
                this.onReady();
        })
        this.rock.addEventListener("click", ()=>{
            if(this.canChoice == true){
                console.log("choice", "rock");
                this.setPlayerChoice(1);
            }
        });
        this.paper.addEventListener("click", ()=>{
            if(this.canChoice == true){
                console.log("choice", "paper");
                this.setPlayerChoice(2);
            }
        });
        this.scissor.addEventListener("click", ()=>{
            if(this.canChoice == true){
                console.log("choice", "scissor");
                this.setPlayerChoice(3);
            }
        });

        this.prepare();
    }
    this.onEnd = function(){
        this.text.innerHTML = "Бувайте!";
        setTimeout(()=>{
            app.next();
        }, 2500)
    }
    this.onGameOver = function(){
        this.text.innerHTML = "Потом попробуешь<br>еще)";
        setTimeout(()=>{
            app.gameOver(this.key);
        }, 2500)
    }

    return this;
}

function Outro(data, key){
    this.__proto__ = new Game(data, key);

    this.onStart = function(){
        this.root.innerHTML = `
        <style>
            body{
                background: #FFF8BC;
            }
            h1{
                position: absolute;
                text-align: center;
                top: 45%;
                width: 100%;
            }
            h1#Key{
                top: 60%;
            }
        </style>
            <h1 id="Key">${app.secretCode}</h1>
            <h1>Усё!</h1>
        `
    }

    return this;
}

function App(data){
    this.menu = {
        root : document.body.querySelector(".menu"),
        show(){
            this.root.classList.add("active");
        },
        close(){
            this.root.classList.remove("active");
        }
    }

    this.secretCode = "";
    this.data = data;
    this.title = document.body.querySelector(".title");
    this.descr = document.body.querySelector(".description");

    this.secret = [
        document.body.querySelector(".secret0"),
        document.body.querySelector(".secret1"),
        document.body.querySelector(".secret2"),
        document.body.querySelector(".secret3"),
        document.body.querySelector(".secret3")
    ]

    this.background = document.body.querySelector("#background");
    this.middleLayer = document.body.querySelector("#middleLayer");
    this.games = [];
    this.currentGame = null;

    this.addGame = function(data){
        let game;

        switch(data.type){
            case "SwordTurn":
                game = new SwordTurn(data.data, this.games.length);
                break;
            case "UnderwaterSign":
                game = new UnderwaterSign(data.data, this.games.length);
                break;
            case "Race":
                game = new Race(data.data, this.games.length);
                break;
            case "RockPaperScissors":
                game = new RockPaperScissors(data.data, this.games.length);
                break;
            default :
                game = new Outro(data.data, this.games.length);
        }

        this.games.push(game);
    }
    this.gameOver = function(){

    }

    this.start = function(gameId){
        this.current = gameId - 1;
        this.next();
    }

    this.next = function(){
        if(this.currentGame){
            this.currentGame.close();
        }
        this.current++;
        this.currentGame = this.games[this.current];
        this.menu.root.innerHTML = `
            <div class="button-container">
                <span>${this.data[this.current].data.intro?this.data[this.current].data.intro:this.data[this.current].data.title + "<br><br>" + this.data[this.current].data.descr}</span>
            </div>
            <div class="button-container">
                <button onclick="app.currentGame.start();app.menu.close();"><imgrep>play_button</imgrep></button>
                <span>Начать</span>
            </div>
        `;
        ImageReplacer(this.menu.root);
        this.menu.show();
    }

    this.setReplay = function(key){
        this.menu.replay.onclick = (e)=>{
            this.currentGame = null;
            this.start(key);
            this.menu.close();
        }
    }
    this.init = function(){
        for(let game of this.data){
            this.addGame(game);
        }
    }

    return this;
}

let app;

function init(){
    let out = "";

    out = `
        <div id="background"></div>
        <div class="secret-bar">
            <div class="secret unknown secret0">
                <div class="pulse"></div>
                <imgrep>paper</imgrep>
                <span>?</span>
            </div>
            <div class="secret unknown secret1">
                <div class="pulse"></div>
                <imgrep>paper</imgrep>
                <span>?</span>
            </div>
            <div class="secret unknown secret2">
                <div class="pulse"></div>
                <imgrep>paper</imgrep>
                <span>?</span>
            </div>
            <div class="secret unknown secret3">
                <div class="pulse"></div>
                <imgrep>paper</imgrep>
                <span>?</span>
            </div>
        </div>

        <div id="middleLayer"></div>

        <div class="description-panel">
            <imgrep>big_paper</imgrep>
            <span class="title">Пращение №1</span>
            <p class="description">Обрати мечи в землю</p>
        </div>

        <div class="menu">
            <div class="button-container">
                <span>Отлично</span>
            </div>
            <div class="button-container">
                <button id="replay" onclick="game1.replay();"><imgrep>replay</imgrep></button>
                <span>Заново</span>
            </div>
        </div>
    `;

    document.body.innerHTML = out;

    app = new App(STRUCT.games);
    app.init();
    app.start(0);

    ImageReplacer(document.body);
}