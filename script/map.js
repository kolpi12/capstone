class Dong{
    constructor(code, gu, dong) {
        this.dongHjCode = code;
        this.guName = gu;
        this.dongName = dong;
        this.hourPop = {};
        for(let index = 0; index < 24; index++) this.hourPop[index] = 0;
    }
    
    plusHourPop(time, value) { this.hourPop[time] += value; }
    getHourPop(time) { return this.hourPop[time]; }
}

class Gu{
    constructor(code, gu) {
        this.guHjCode = code;
        this.guName = gu;
        this.outPop = {};
        for(let index = 0; index < 24; index++) {
            this.outPop[index] = {};
        }
    }
}

function documentInit(boxId, mapJson, mapObj) {
    // 각종 변수 초기화
    var dong = {};
    var gu = {};
    dongInit();
    guInit();
    const WIDTH = 750,
    HEIGHT = 600;
    var svg = d3.select(boxId).append('svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);
    var checked = {dongHjCode:11110515};
    var guSvg = d3.select('#gu_map').append('svg').attr('height', WIDTH*2/3).attr('width', HEIGHT*2/3+50)
        .append('g').attr('id', 'guMap');
    var mapSvg = svg.append('g').attr('id', 'map');
    var guName = document.querySelector('#gu_nm');
    var dongName = document.querySelector('#dong_nm');
    var hjCode = document.querySelector('#hj_cd > h3');
    var pop = document.querySelector('#pop > h3');
    var timeSlider = document.querySelector('#time_slider');
    var outGuName = document.querySelector('#out_gu_nm > h3');
    var outPop = document.querySelector('#out_pop > h3');
    setTooltip('종로구', '청운효자동', 11110515, 12345);
    d3.select('#time_slider').on('input', function() { changeBaseTime(+this.value); });
    var color = d3.scaleThreshold()
        .domain([2000,4000,6000,8000,10000,20000,50000])
        .range(d3.schemeYlOrBr[8]);
    var color2 = d3.scaleThreshold()
        .domain([100,200,400,500,1000,2000,5000])
        .range(d3.schemeYlOrBr[8]);

    // 편의 함수
    function pad(n, width) {
        // n: 입력 숫자
        // width: 숫자의 자릿수
        // 입력 숫자에 해당 자릿수만큼 앞에 0을 붙임
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    }

    function setTooltip(gu, dong, code, popVal) {
        guName.innerText = gu;
        dongName.innerText = dong;
        hjCode.innerText = code;
        pop.innerText = popVal;
    }

    function setOutTooltip(gu, popVal) {
        outGuName.innerText = gu;
        outPop.innerText = popVal;
    }

    function changeFeatureColor() {
        mapSvg.selectAll('path')
            .attr('fill', function(d) { return color(dong[d.properties.EMD_HJ_CD].getHourPop(timeSlider.value)); });
        guSvg.selectAll('path')
            .attr('fill', function(d) { return color2(gu[d.properties.SIG_HJ_CD].outPop[timeSlider.value][checked.dongHjCode]) })
    }

    function changeBaseTime(time) {
        d3.select('#time_slider').property('value', time);
        changeFeatureColor();
        pop.innerText = dong[hjCode.innerText].getHourPop(timeSlider.value);
        document.querySelector('#time').innerText = `${pad(timeSlider.value, 2)}시`;
    }

    // 구 초기화
    function guInit() {
        d3.json('json/gu_cd.json').then(function(d) {
            for(let index = 0; index < d.length; index++) {
                let data = d[index];
                gu[data.RESD_CD] = new Gu(data.RESD_CD, data.RESC_LCT_NM);
            }
            for (const code in gu) {
                if (gu.hasOwnProperty(code)) {
                    const element = gu[code];
                    for (let index = 0; index < 24; index++) { Object.keys(dong).forEach(code => { element['outPop'][index][code] = 0; }); }
                }
            }
        });
    }

    // 동 초기화
    function dongInit() {
        d3.json("json/dong_cd.json").then(function(d) {
            for(let index = 0; index < d.length; index++) {
                let data = d[index];
                dong[data.H_DNG_CD] = new Dong(data.H_DNG_CD, data.CT_NM, data.H_DNG_NM);
            }
            changeBaseTime(12);
        });
    }

    // 동 유동인구 초기화
    function floatingPopInit() {
        d3.csv('data/floating_pop/INNER_PEOPLE_20191101.csv').then(function(d) {
            for (let index = 0; index < d.length; index++) {
                let data = d[index];
                data['총생활인구수'] = Math.round(data['총생활인구수']);
                dong[data['행정동코드']].plusHourPop(+data['시간대구분'], +data['총생활인구수']);
                gu[data['거주지 자치구 코드']]['outPop'][+(data['시간대구분'])][data['행정동코드']] = data['총생활인구수'];
            }
        });
        d3.csv('data/floating_pop/METRO_PEOPLE_20191101.csv').then(function(d) {
            for (let index = 0; index < d.length; index++) {
                const data = d[index];
                if(gu[data['대도시권거주지코드']] === undefined) {}
                else {
                    gu[data['대도시권거주지코드']]['outPop'][+(data['시간대구분'])][data['행정동코드']] = +data['총생활인구수'];
                    dong[data['행정동코드']].plusHourPop(+(data['시간대구분']), +data['총생활인구수'])
                }
            }
            changeFeatureColor();
            checked = dong['11110515'];
        })
    }

    // 구 지도 그리기
    function guMapInit(mapJson, mapObj) {
        d3.json(mapJson).then(function(d) {
            let mapData = topojson.feature(d, d.objects[mapObj]);
            let center = d3.geoCentroid(mapData);
            center[0] += 0.47; center[1] -= 0.10;
            let scale = 15500;
            let projection = d3.geoMercator().translate([WIDTH/2, HEIGHT/2])
                .scale(scale).center(center);
            let path = d3.geoPath().projection(projection);

            guSvg.selectAll('path')
                .data(mapData.features)
                .enter().append('path')
                .attr('d', path)
                .attr('id', function(d) { return 'c' + d.properties.SIG_HJ_CD; })
                .on('mouseover', function(d) {
                    d3.select(this).raise();
                    setOutTooltip(d.properties.SIG_KOR_LN, gu[d.properties.SIG_HJ_CD]['outPop'][timeSlider.value][checked.dongHjCode])
                })
            d3.select('#c' + parseInt(checked['dongHjCode']/1000)).raise().attr('class', 'checked');
        });
    }

    // 동 지도 그리기
    function mapInit(mapJson, mapObj) {
        d3.json(mapJson).then(function(d) {
            let mapData = topojson.feature(d, d.objects[mapObj]);
            let center = d3.geoCentroid(mapData);
            center[0] -= 0.015; center[1] += 0.015;
            let scale = 98000;
            let projection = d3.geoMercator().translate([WIDTH/2, HEIGHT/2])
                .scale(scale).center(center);
            let path = d3.geoPath().projection(projection);

            mapSvg.selectAll('path')
                .data(mapData.features)
                .enter().append('path')
                .attr('d', path)
                .attr('id', function(d) { return 'c'+d.properties.EMD_HJ_CD; })
                .on('click', function(d) {
                    mapSvg.select('#c'+checked['dongHjCode']).attr('class', null);
                    d3.select('#c' + parseInt(checked['dongHjCode']/1000)).attr('class', null);
                    checked = dong[d.properties.EMD_HJ_CD];
                    d3.select(this).raise().attr('class', 'checked');
                    d3.select('#c' + parseInt(checked['dongHjCode']/1000)).raise().attr('class', 'checked');
                    changeFeatureColor();
                })
                .on('mouseover', function(d) {
                    d3.select(this).raise();
                    let prop = d.properties;
                    setTooltip(prop.SIG_KOR_LN, prop.ADM_DR_NM, prop.EMD_HJ_CD, dong[prop.EMD_HJ_CD].getHourPop(timeSlider.value));
                })
                .on('mouseout', function(d) {
                    setTooltip(checked['guName'], checked['dongName'], checked['dongHjCode'], checked.getHourPop(timeSlider.value));
                });
            d3.select('#c' + checked['dongHjCode']).attr('class', 'checked');
        });
    }

    // 색상 범례 그리기
    function legends() {
        const boxLength = 50;
        const margin = 5;
        let x = {};
        let i = 0;
        color.range().forEach(element => {
            x[element] = i * (boxLength + margin);
            i++;
        });
        let legend = d3.select('#legends')
            .append('svg')
            .attr('width', (boxLength + margin) * 9 + 20)
            .append('g');
        legend.selectAll('rect')
            .data(color.range()).enter()
            .append('rect')
            .attr('transform', 'translate(20, 10)')
            .attr('fill', d => { return d; })
            .attr('x', d => { return x[d]; })
            .attr('y', 0)
            .attr('width', boxLength)
            .attr('height', boxLength / 2);
        
        i = 1;
        legend.selectAll('text')
            .data(color.domain()).enter()
            .append('text')
            .html(function(d) { return d; })
            .attr('transform', 'translate(20, 55)')
            .attr('text-anchor', 'middle')
            .attr('x', function(d) { return x[Object.keys(x)[i++]] - 2.5; })
            .attr('y', 0)

    }

    mapInit(mapJson, mapObj);
    guMapInit('json/2_SIG.json', '2_SIG');
    floatingPopInit();
    legends();
}

// test code
