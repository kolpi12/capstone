class Dong{
    constructor(code, name) {
        this.dongHjCode = code;
        this.dongName = name;
        this.hourPop = {};
        for(let index = 0; index < 24; index++) {
            this.hourPop[index] = 0;
        }
    }
    
    plusHourPop(time, value) {
        this.hourPop[time] += value;
    }

    getHourPop(time) {
        return this.hourPop[time];
    }
}

function documentInit(boxId, mapJson, mapObj) {
    // 각종 변수 초기화
    var dong = {};
    dongInit();
    const WIDTH = 750,
    HEIGHT = 610;
    var svg = d3.select(boxId).append('svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);
    var mapSvg = svg.append('g').attr('id', 'map');
    var guName = document.querySelector('#gu_nm > h3');
    var dongName = document.querySelector('#dong_nm > h3');
    var hjCode = document.querySelector('#hj_cd > h3');
    var pop = document.querySelector('#pop > h3');
    var naturalBreak = false;
    var everyPop = {};
    var timeSlider = document.querySelector('#time_slider');
    setTooltip('종로구', '청운효자동', 11110515, 12345);
    d3.select('#time_slider').on('input', function() { changeBaseTime(+this.value); });
    var color = d3.scaleThreshold()
        .domain([2000,4000,6000,8000,10000,20000,50000])
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

    function changeFeatureColor() {
        mapSvg.selectAll('path')
            .attr('fill', function(d) { return color(dong[d.properties.EMD_HJ_CD].getHourPop(timeSlider.value)); });
    }

    function changeBaseTime(time) {
        d3.select('#time_slider').property('value', time);
        if (naturalBreak) {
            color = d3.scaleCluster()
                .domain(everyPop[timeSlider.value])
                .range(d3.schemeYlOrBr[9]);
        }
        changeFeatureColor();
        pop.innerText = dong[hjCode.innerText].getHourPop(timeSlider.value);
        document.querySelector('#time').innerText = `${pad(timeSlider.value, 2)}시`;
    }

    // 동 초기화
    function dongInit() {
        d3.json("json/dong_cd.json").then(function(d) {
            for(let index = 0; index < d.length; index++) {
                let data = d[index];
                dong[data.H_DNG_CD] = new Dong(data.H_DNG_CD, data.H_DNG_NM);
            }
            changeBaseTime(12);
        });
    }

    // 동 유동인구 초기화
    function floatingPopInit(map) {
        d3.csv('data/floating_pop/INNER_PEOPLE_20191101.csv').then(function(d) {
            for (let index = 0; index < d.length; index++) {
                let data = d[index];
                data['총생활인구수'] = Math.round(data['총생활인구수']);
                dong[data['행정동코드']].plusHourPop(+data['시간대구분'], +data['총생활인구수']);
            }
            changeFeatureColor();
            if (naturalBreak) {
                for (let index = 0; index < 24; index++) {
                    everyPop[index] = [];
                    for (const key in dong) {
                        if (dong.hasOwnProperty(key)) {
                            const element = dong[key];
                            everyPop[index].push(element.hourPop[index]);
                        }
                    }
                }
                color = d3.scaleCluster()
                    .domain(everyPop[timeSlider.value])
                    .range(d3.schemeYlOrBr[9]);
            }
        });
    }

    // 동 지도 그리기
    function mapInit(mapJson, mapObj) {
        d3.json(mapJson).then(function(d) {
            let mapData = topojson.feature(d, d.objects[mapObj]);
            let center = d3.geoCentroid(mapData);
            center[0] -= 0.015; center[1] += 0.015;
            let scale = 100000;
            let projection = d3.geoMercator().translate([WIDTH/2, HEIGHT/2])
                .scale(scale).center(center);
            let path = d3.geoPath().projection(projection);

            mapSvg.selectAll('path')
                .data(mapData.features)
                .enter().append('path')
                .attr('d', path)
                .on('mouseover', function(d) {
                    let prop = d.properties;
                    setTooltip(prop.SIG_KOR_LN, prop.ADM_DR_NM, prop.EMD_HJ_CD, dong[prop.EMD_HJ_CD].getHourPop(timeSlider.value));
                });
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
    floatingPopInit(mapSvg);
    legends();
}

// test code
