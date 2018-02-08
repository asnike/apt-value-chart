function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function onWindowLoad() {
    chrome.tabs.executeScript(null, {
        file: 'jquery-3.2.0.min.js'
    }, function(){
        chrome.tabs.executeScript(null, {
            file: "getSource.js"
        }, function() {
            if (chrome.extension.lastError) {
                document.body.innerText = 'There was an error injecting script : \n' + chrome.extension.lastError.message;
            }
        });
    });
    $('.btn-excel').click(function(){
        var tab_text="<table border='2px'><tr bgcolor='#87AFC6'>";
        var textRange; var j=0;
        tab = document.getElementById('apt-price'); // id of table

        for(j = 0 ; j < tab.rows.length ; j++)
        {
            tab_text=tab_text+tab.rows[j].innerHTML+"</tr>";
            //tab_text=tab_text+"</tr>";
        }

        tab_text=tab_text+"</table>";
        tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
        tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
        tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
        {
            txtArea1.document.open("txt/html","replace");
            txtArea1.document.write(tab_text);
            txtArea1.document.close();
            txtArea1.focus();
            sa=txtArea1.document.execCommand("SaveAs",true,"kbsise.xls");
        }
        else                 //other browser not tested on IE 11
            sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));

        return (sa);
    });

    $('.btn-send').click(function(){
        $('#total-render').html('');
        $('#apt-price').css({'display':'none'});
        $('body').showLoading();
        console.log(moment());
        var markedYear = '2004',
            currentYear = moment().format('YYYY'),
            years = [], gap,
            totalCount = 0;
        while(gap = moment(currentYear).diff(moment(markedYear), 'years') > 0){
            nextYear = moment(markedYear).add(59, 'months').format('YYYYMM');
            currYear = moment().format('YYYYMM');
            years.unshift([moment(markedYear).format('YYYYMM'), moment(currYear).diff(moment(nextYear)) > 0 ? nextYear : currYear]);
            markedYear = moment(markedYear).add(60, 'months').format('YYYY');
            totalCount++;
        }
        var currentCount = 0;

        console.log(years);
        start();
        function start(){
            console.log('start~~');
            if(currentCount < totalCount){
                var param = years[currentCount];
                param = {
                    startYear:param[0].substr(0, 4),
                    startMonth:param[0].substr(4, 2),
                    endYear:param[1].substr(0, 4),
                    endMonth:param[1].substr(4, 2)
                };
                currentCount++;
                getData(param);
                console.log('get data start...');
            }else{
                console.log('get data end...');

                $('.tbl_col').each(function(idx, item){
                    console.log('item : ', $(item).children('table').children('tbody'), idx);
                    $($(item).children('table').children('tbody').html()).appendTo('#total-render');
                });
                console.log('이름 : ', $($('#물건식별자').children(':selected')[0]).text());


                $('#apt-name').text($($('#부동산대지역코드').children(':selected')[0]).text() + ' '
                    + $($('#부동산중지역코드').children(':selected')[0]).text() + ' '
                    + $($('#부동산소지역코드').children(':selected')[0]).text() + ' '
                    +$($('#물건식별자').children(':selected')[0]).text());
                $('#temp-render').html('');
                $('#apt-price').css({'display':'table'});
                $('body').hideLoading();
            }
        }

        function getData(param){
            var query = '&조회시작년도='+param.startYear+'&조회시작월='+param.startMonth+'&조회종료년도='+param.endYear+'&조회종료월='+param.endMonth;
            $.ajax({
                url:$('input[name="url"]').val() + query,
            })
                .done(function(result){
                    console.log(result);
                    $(result).appendTo('#temp-render');
                    start();
                });
        }
    });
}
window.onload = onWindowLoad;
