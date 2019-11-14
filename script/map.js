class Dong{
    constructor(code, name) {
        this.dong_code = code;
        this.dong_name = name;
        this.hour_pop = {};
        for (let index = 0; index < 24; index++) {
            this.hour_pop[index] = 0;
        }
    }
}

function documentInit(boxId, mapJson, mapObj) {
    // 행정동 데이터 받아오기
    var dong = {};
    function dongInit() {
        var dongCode = d3.json("json/dong_cd.json").then(function(d) {
            for(let index = 0; index < d.length; index++) {
                dong[d[index].H_DNG_CD] = new Dong(d[index].H_DNG_CD, d[index].H_DNG_NM);
            }
        });
    }
    
    // 시내 유동인구 데이터 받아오기
    var color = d3.scaleThreshold()
    function floatingPopInit() {
        var floatingPop = d3.csv("data/floating_pop/INNER_PEOPLE_20191101.csv").then(function(d) {
            let max = 0;
            for(let index = 0; index < d.length; index++) {
                let data = d[index];
                data["총생활인구수"] = Math.round(data["총생활인구수"]);
                dong[data['행정동코드']]["hour_pop"][+data['시간대구분']] += +(data['총생활인구수']);
                if(max < data['총생활인구수']) {
                    max = data['총생활인구수'];
                }
                // TODO: 총생활인구수 합계 최댓값 구하기 -> 컬러 스킴 지정
            }
            for (const k in dong) {
                if (dong.hasOwnProperty(k)) {
                    const element = dong[k];
                    console.log(element['hour_pop'])
                }
            }
            color = d3.scaleThreshold()
                .domain([1000,2000,3000,4000,5000,10000,20000,50000])
                .range(d3.schemeYlOrBr[9]);
            mapSvg.selectAll("path")
                .attr("fill", function(d) { return color(dong[d.properties.EMD_HJ_CD]['hour_pop'][12]); });
        });
        // TODO: 일정 시간대/성별/연령대/거주지/행정구역 별로 유동인구 추출
        // TODO: 2개 이상의 유동인구 데이터 비교 분석
    }

    // 맵 만들기
    const WIDTH = 750,
    HEIGHT = 610;
    var svg = d3.select(boxId).append("svg")
    .attr("width", WIDTH)
    .attr('height', HEIGHT);
    var mapSvg = svg.append("g").attr("id", "map");
    var guName = document.querySelector("#gu_nm > h3");
    var dongName = document.querySelector("#dong_nm > h3");
    var hjCode = document.querySelector("#hj_cd > h3");
    function setTooltip(gu, dong, code) {
        guName.innerText = gu;
        dongName.innerText = dong;
        hj_cd.innerText = code;
    }
    function mapInit(mapJson, mapObj) {
        var mapFeature = d3.json(mapJson).then(function(d) {
            let mapData = topojson.feature(d, d.objects[mapObj]);
            let center = d3.geoCentroid(mapData);
            center[0] -= 0.015;
            center[1] += 0.015;
            let scale = 100000;
            let projection = d3.geoMercator().translate([WIDTH/2, HEIGHT/2])
                .scale(scale).center(center);
            let path = d3.geoPath().projection(projection);

            mapSvg.selectAll("path")
                .data(mapData.features)
                .enter().append("path")
                .attr("d", path)
                .on("mouseover", function(d) {
                    setTooltip(d.properties.SIG_KOR_LN, d.properties.ADM_DR_NM, dong[d.properties.EMD_HJ_CD]['hour_pop'][12]);
                })
                // .on("mouseover", function(){ // 마우스 호버 시 z-index 높이기 위함
                //     d3.select(this).raise();
                // });
                // mouseout
        });
    }
    dongInit();
    floatingPopInit();
    mapInit(mapJson, mapObj);
}
