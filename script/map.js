class Dong{
    constructor(code, gu, dong) {
        this.dongHjCode = code;
        this.guName = gu;
        this.dongName = dong;
        this.hourPop = {};
        this.male = {};
        this.female = {};
        for(let index = 0; index < 24; index++) {
            this.hourPop[index] = 0;
            this.male[index] = {};
            this.female[index] = {};
            for(let age = 10; age < 80; age += 5){
                this.male[index][age] = 0;
                this.female[index][age] = 0;
            }
        }
    }
    
    plusHourPop(time, value) {
        this.hourPop[time] += value;
    }

    getHourPop(time) {
        return this.hourPop[time];
    }
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
    floatingPopInit('2019', '11', '01');
    const WIDTH = 750,
    HEIGHT = 600;
    var svg = d3.select(boxId).append('svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);
    var checked = new Dong(11110515, '종로구', '청운효자동');
    var guChecked = new Gu(11110, '종로구')
    var guSvg = d3.select('#gu_map').append('svg').attr('height', WIDTH*2/3).attr('width', HEIGHT*2/3+50)
        .append('g').attr('id', 'guMap');
    var mapSvg = svg.append('g').attr('id', 'map');
    var guName = document.querySelector('#gu_nm');
    var dongName = document.querySelector('#dong_nm');
    var hjCode = document.querySelector('#hj_cd');
    var pop = document.querySelector('#pop');
    var timeSlider = document.querySelector('#time_slider');
    var outGuName = document.querySelector('#out_gu_nm');
    var outPop = document.querySelector('#out_pop');
    setTooltip('종로구', '청운효자동', 11110515, 12345);
    d3.select('#time_slider').on('input', function() { changeBaseTime(+this.value); });
    d3.select('#date').on('input', function() { changeBaseDate(this.value) })
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
            .attr('fill', function(d) { return color(dong[d.properties.EMD_HJ_CD].getHourPop(+timeSlider.value)); });
        guSvg.selectAll('path')
            .attr('fill', function(d) { return color2(gu[d.properties.SIG_HJ_CD].outPop[+timeSlider.value][checked.dongHjCode]) });
    }

    function changeBaseTime(time) {
        d3.select('#time_slider').property('value', time);
        changeFeatureColor();
        pop.innerText = dong[hjCode.innerText].getHourPop(+timeSlider.value);
        document.querySelector('#time').innerText = `${pad(+timeSlider.value, 2)}시`;
        allGender();
        allAge();
        d3.select('#age').selectAll('.chart').attr('stroke', d => timeSlider.value == d.time ? 'black' : 'rgba(150,150,150,0.5)')
    }

    let noDate = {'2019-09-02': false, '2019-09-03': false, '2019-10-15': false, '2019-10-16': false, '2019-10-17': false,
    '2019-10-18': false, '2019-10-19': false, '2019-10-20': false, '2019-10-21': false, '2019-10-22': false, '2019-10-23': false,
    '2019-10-24': false, '2019-10-25': false, '2019-10-26': false, '2019-10-27': false, '2019-10-28': false, '2019-10-29': false,
    '2019-10-30': false}
    function changeBaseDate(date) {
        if (date in noDate) {
            d3.select('#dateError').html('데이터가 없습니다. 다른 날짜를 선택하세요.')
        } else {
            floatingPopInit(date.slice(0,4), date.slice(5,7), date.slice(8, 10))
            d3.select('#dateError').html('')
        }
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
            changeBaseTime();
        });
    }

    // 동 유동인구 초기화
    function floatingPopInit(year, month, day) {
        if(Object.keys(dong).length === 0 && dong.constructor === Object) {for(const index in dong){if (dong.hasOwnProperty(index)){delete dong[index]}}}
        dongInit();
        if(Object.keys(gu).length === 0 && gu.constructor === Object) {for(const index in gu){if (gu.hasOwnProperty(index)){delete gu[index]}}}
        guInit();
        d3.csv(`data/floating_pop/INNER_PEOPLE_${year}${month}${day}.csv`).then(function(d) {
            for (let index = 0; index < d.length; index++) {
                let data = d[index];
                data['총생활인구수'] = Math.round(data['총생활인구수']);
                dong[data['행정동코드']].plusHourPop(+data['시간대구분'], +data['총생활인구수']);
                for (let age = 10; age < 80; age += 5) {
                    let ageM = data[`남자${age}세부터${age+4}세생활인구수`];
                    let ageF = data[`여자${age}세부터${age+4}세생활인구수`];
                    if(ageM === '*') { ageM = 1; }
                    if(ageF === '*') { ageF = 1; }
                    dong[data['행정동코드']]['male'][+data['시간대구분']][age] += +ageM;
                    dong[data['행정동코드']]['female'][+data['시간대구분']][age] += +ageF;
                }
                gu[data['거주지 자치구 코드']]['outPop'][+data['시간대구분']][data['행정동코드']] += +data['총생활인구수'];
            }
        });
        d3.csv(`data/floating_pop/METRO_PEOPLE_${year}${month}${day}.csv`).then(function(d) {
            for (let index = 0; index < d.length; index++) {
                const data = d[index];
                if(gu[data['대도시권거주지코드']] === undefined) {}
                else {
                    for (let age = 10; age < 80; age += 5) {
                        let ageM = data[`남자${age}세부터${age+4}세생활인구수`];
                        let ageF = data[`여자${age}세부터${age+4}세생활인구수`];
                        if(ageM === '*') { ageM = 1; }
                        if(ageF === '*') { ageF = 1; }
                        dong[data['행정동코드']]['male'][+data['시간대구분']][age] += +ageM;
                        dong[data['행정동코드']]['female'][+data['시간대구분']][age] += +ageF;
                    }
                    gu[data['대도시권거주지코드']]['outPop'][+data['시간대구분']][data['행정동코드']] += +data['총생활인구수'];
                    dong[data['행정동코드']].plusHourPop(+data['시간대구분'], +data['총생활인구수']);
                }
            }
            changeFeatureColor();
            checked = dong['11110515'];
            allGender();
            allAge()
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
                    setOutTooltip(d.properties.SIG_KOR_LN, gu[d.properties.SIG_HJ_CD]['outPop'][+timeSlider.value][checked.dongHjCode])
                })
            d3.select('#c' + parseInt(checked['dongHjCode']/1000)).raise().attr('class', 'checked');
            guSvg.append('text')
                .attr('x', 10)
                .attr('y', 25)
                .attr('style', 'font-size: 20;')
                .html('유출지 지도')
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
                    allGender();
                    allAge();
                })
                .on('mouseover', function(d) {
                    d3.select(this).raise();
                    let prop = d.properties;
                    setTooltip(prop.SIG_KOR_LN, prop.ADM_DR_NM, prop.EMD_HJ_CD, dong[prop.EMD_HJ_CD].getHourPop(+timeSlider.value));
                })
                .on('mouseout', function(d) {
                    setTooltip(checked['guName'], checked['dongName'], checked['dongHjCode'], checked['hourPop'][+timeSlider.value]);
                });
            d3.select('#c' + checked['dongHjCode']).attr('class', 'checked');
            mapSvg.append('text')
                .attr('x', 10)
                .attr('y', 25)
                .attr('style', 'font-size: 20;')
                .html('서울시 유동인구 지도')
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
        let inLegend = d3.select('#in_pop_legend')
            .attr('width', (boxLength + margin) * 9 + 20)
            .attr('height', 80)
            .append('g');
        inLegend.selectAll('rect')
            .data(color.range()).enter()
            .append('rect')
            .attr('transform', 'translate(20, 10)')
            .attr('fill', d => { return d; })
            .attr('x', d => { return x[d]; })
            .attr('y', 0)
            .attr('width', boxLength)
            .attr('height', boxLength / 2);
        
        i = 1;
        inLegend.selectAll('text')
            .data(color.domain()).enter()
            .append('text')
            .html(function(d) { return d; })
            .attr('transform', 'translate(20, 55)')
            .attr('text-anchor', 'middle')
            .attr('x', function(d) { return x[Object.keys(x)[i++]] - 2.5; })
            .attr('y', 0)
        
        let outLegend = d3.select('#out_pop_legend')
            .attr('width', (boxLength + margin) * 9 + 20)
            .append('g');
            
        outLegend.selectAll('rect')
            .data(color2.range()).enter()
            .append('rect')
            .attr('transform', 'translate(20, 10)')
            .attr('height', 80)
            .attr('fill', d => { return d; })
            .attr('x', d => { return x[d]; })
            .attr('y', 0)
            .attr('width', boxLength)
            .attr('height', boxLength / 2);

        i = 1;
        outLegend.selectAll('text')
            .data(color2.domain()).enter()
            .append('text')
            .html(function(d) { return d; })
            .attr('transform', 'translate(20, 55)')
            .attr('text-anchor', 'middle')
            .attr('x', function(d) { return x[Object.keys(x)[i++]] - 2.5; })
            .attr('y', 0)
    }
    {
        // 전체 성별 차트
        let domain = [];
        for (let i = 10; i < 80; i += 5) { domain.push(i) }
        let width = 400,
        height = 230,
        margin = {top: 10, right: 10, bottom: 10, left: 10},
        svg = d3.select('#gender_box').append('svg').attr('width', width).attr('height', height)
        svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`),
        x = d3.scaleBand().range([0, width - margin.left - margin.right]).padding(0.1).domain(domain),
        y = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]).domain([0, 15000]),
        xAxis = d3.axisBottom().scale(x);
        svg.append('g').attr('transform', `translate(0, ${height - margin.top - margin.bottom})`).attr('class', 'gender_xAxis')
            .call(xAxis);

        function allGender() {
            let mData = [], fData = [];
            for(let age = 10; age < 80; age += 5){
                mData.push({'age': age, value: checked['male'][timeSlider.value][age]});
                fData.push({'age': age, value: checked['female'][timeSlider.value][age]});
            }
            
            let line = d3.line()
                .x(d => x(d.age))
                .y(d => y(d.value))
                .curve(d3.curveMonotoneX);

            let m = svg.selectAll('.male').data([mData], d => d.age);
            let f = svg.selectAll('.female').data([fData], d => d.age);
            
            m.enter().append('path').attr('class', 'male')
                .merge(m).transition().duration(500).attr('d', line).attr('fill', 'none').attr('stroke', 'steelblue')
                .attr('stroke-width', 3).attr('stroke-opacity', 0.8);
            f.enter().append('path').attr('class', 'female')
                .merge(f).transition().duration(500).attr('d', line).attr('fill', 'none').attr('stroke', 'tomato')
                .attr('stroke-width', 3).attr('stroke-opacity', 0.8);
        }
    }
    {
        // 전체 연령 차트
        let domainAge = [],
        domainTime = [];
        for(let index = 10; index < 80; index += 5) { domainAge.push(index) }
        for(let index = 0; index < 24; index++) { domainTime.push(index) }
        let width = 500,
        height = 300,
        margin = {top: 20, right: 20, bottom: 20, left: 20},
        svg = d3.select('#age').attr('width', width).attr('height', height),
        x = d3.scaleBand().domain(domainTime).range([margin.left, width - margin.right]).padding(0.1),
        y = d3.scaleBand().domain(domainAge).range([height - margin.bottom, margin.top]).padding(0.1),
        ageColor = d3.scaleLinear().domain([0,5000]).range(['#fee8c8', '#d7301f']),
        xAxis = g => g.attr('transform', `translate(0, ${height - margin.bottom})`).call(d3.axisBottom(x)),
        yAxis = g => g.attr('transform', `translate(${margin.left}, 0)`).call(d3.axisLeft(y));
        svg.append('g').attr('class', 'xAxis').call(xAxis);
        svg.append('g').attr('class', 'yAxis').call(yAxis);
        function allAge() {
            data = [];
            for (let age = 10; age < 80; age += 5) {
                for (let time = 0; time < 24; time++) {
                    data.push({'time': time, 'age': age, value: checked.male[time][age] + checked.female[time][age]})
                }
            }
            let rects = svg.selectAll('.chart').data(data)
            rects.enter()
                .append('rect')
                .attr('class', 'chart')
                .attr('stroke', d => d.time == timeSlider.value ? 'black' : 'rgba(150,150,150,0.65)')
                .attr('fill', d => ageColor(d.value))
                .attr('x', d => x(d.time))
                .attr('y', d => y(d.age))
                .attr('width', 15)
                .attr('height', 15);
                // .on('mouseover');

            rects.transition().duration(500)
                .attr('fill', d => ageColor(d.value));

            rects.exit().remove();
        }
    }

    mapInit(mapJson, mapObj);
    guMapInit('json/2_SIG.json', '2_SIG');
    
    legends();
}

// test code
