function managerindexfunction() {
    const whologin = indexgetManager()
    showManagerShop(0, 10, 1, whologin).then(() => {
        Chart.register(ChartDataLabels)
        //商家导航栏
        managernav(whologin)
        logout(whologin)
        openANDcloseBox(whologin)
        searchShop(whologin)
        addshop(whologin)
        gobackshopbox()
    })
}
//打开和关闭遮罩层
function openModal(id) {
    document.getElementById(id).classList.add("active")
}
function closeModal(id) {
    document.getElementById(id).classList.remove("active")
}
//请求数据
async function fetchdatas(url, requestBody) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
        return await response.json()
    } catch (error) {
        console.error('获取数据失败:', error)
        return { success: false, data: [] }
    }
}
//主页从url读取用户信息
function indexgetManager() {
    let urlParams = new URLSearchParams(window.location.search)
    let whologin = {
        who: urlParams.get('who') ? urlParams.get('who') : 'nobody',
        name: urlParams.get('name'),
        email: urlParams.get('email')
    }
    return whologin
}
//--------------导航栏操作------------------
//显示导航栏
function managernav(whologin) {
    const username = document.querySelector('.shopbox .searchbox .usermessage .username')
    if (whologin.name) username.innerText = `${whologin.name}，欢迎回来`
}
//退出登录
function logout(whologin) {
    const getlogout = document.querySelector('.navbox .logout')
    let isLoggingOut = false // 防止重复执行
    // 退出按钮点击事件
    getlogout.addEventListener('click', function () {
        if (isLoggingOut) return
        isLoggingOut = true
        logoutTime(1)
        window.location.replace('http://localhost')
    })
    // 监听窗口关闭
    window.addEventListener("beforeunload", (event) => {
        console.log(whologin)
        if (isLoggingOut) return
        isLoggingOut = true
        logoutTime(2)
    }, { once: true })
    // 退出请求
    function logoutTime(status) {
        try {
            fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    who: whologin.who,
                    email: whologin.email,
                    name: whologin.name,
                    status
                })
            })
        } catch (err) {
            console.error('数据发送失败:', err);
        }
    }
}
//点击浏览不同的box
function openANDcloseBox(whologin) {
    document.querySelector('.navbox').addEventListener('click', async (event) => {
        const activeElement = document.querySelector('.navbox div.active')
        if (!activeElement) return
        const beOpenBox = event.target.closest('.goshopbox, .gochartbox')?.classList[0]
        if (!beOpenBox || activeElement.classList.contains(beOpenBox)) return
        const activeBoxId = activeElement.classList[0]
        switch (activeBoxId) {
            case 'goshopbox':
                document.getElementById('goshopchartbox')?.classList.remove('active')
                break
        }
        activeElement.classList.remove('active')
        document.getElementById(activeBoxId)?.classList.remove('active')
        //打开点击的box
        document.getElementById(beOpenBox)?.classList.add('active')
        document.querySelector(`.${beOpenBox}`)?.classList.add('active')
        //重置打开的box的搜索框
        const searchBox = document.querySelector(`#${beOpenBox} .searchbox`)
        if (searchBox) {
            searchBox.querySelector('input').value = ''
        }
        // 对应的box查询展示对应的数据
        const actionMap = {
            'goshopbox': async () => await showManagerShop(0, 10, 1, whologin),
            'gochartbox': async () => await showManagerChart(whologin),
        }
        await actionMap[beOpenBox]?.()
    })
}
//修改搜索框的不同选择
function searchboxshowselectcategory(selectinput, value) {
    const selectbox = selectinput.parentNode
    const input = selectbox.querySelector('input')
    input.value = ''
    let placeholderText = ''
    switch (value) {
        case 'shopname':
            placeholderText = '请输入店铺名'
            break
        case 'shopemail':
            placeholderText = '请输入商家邮箱'
            break
        default:
            placeholderText = '请输入内容'
    }
    input.placeholder = placeholderText
}
//--------------------------------------
//读取商家
async function showManagerShop(offset, limit, page, whologin) {
    try {
        openModal('shopboxloadingOverlay')
        const requestBody = {
            offset,
            limit
        }
        const res = await fetchdatas('/showManagerShop', requestBody)
        await renderManagerShop(res.shops, res.shopslength, page, whologin)
        closeModal('shopboxloadingOverlay')
    } catch (error) {
        console.error('获取数据失败:', error)
    }
}
//渲染商家
async function renderManagerShop(data, dataslength, page, whologin) {
    const shopsbody = document.querySelector('.shopbox .shops .shopsbody')
    shopsbody.innerHTML = ' '
    if (!data.length || !data) {
        //渲染切换页面按钮
        renderswitchpagebutton(1, 'shopbox', dataslength)
        //点击按钮切换
        switchshopbox(whologin)
        document.querySelector('.shopboxtop')?.scrollIntoView({ behavior: 'smooth' })
        return
    }
    const fragment = document.createDocumentFragment()
    data.forEach(shop => {
        const shopdiv = document.createElement('div')
        shopdiv.classList.add('shop')
        shopdiv.setAttribute('id', `${shop.email}`)
        shopdiv.innerHTML = `
        <div class="shopname">${shop.name}</div>
        <div class="shopemail">${shop.email}</div>
        <div class="options">
            <button class="shopchart">查看销售详情</button>
            <button class="resetpwd">重置密码</button>
            <button class="deleteshop">删除商家</button>
        </div>`
        fragment.appendChild(shopdiv)
    })
    shopsbody.appendChild(fragment)
    //渲染切换页面按钮
    renderswitchpagebutton(page, 'shopbox', dataslength)
    // //点击按钮切换商品页面
    switchshopbox(whologin)
    operateshop(whologin)
    showshopchart()
    document.querySelector('.shopboxtop')?.scrollIntoView({ behavior: 'smooth' })
}
//渲染切换页面按钮（商家端/主页用户共用）
function renderswitchpagebutton(page, box, datalength) {
    const switchpage = document.querySelector(`.${box} .switch-page`)
    switchpage.innerHTML = ""
    let buttonlength = Math.ceil(datalength / 10) // 向上取整，确保有足够的页数
    // “上一页”按钮
    if (page > 1) {
        const beforepagebutton = document.createElement('button')
        beforepagebutton.classList.add('before-page')
        beforepagebutton.innerText = '上一页'
        switchpage.appendChild(beforepagebutton)
    }
    // 数字页码按钮
    for (let i = 1; i <= buttonlength; i++) {
        const switchbutton = document.createElement('button')
        switchbutton.innerText = i
        switchbutton.classList.add('number-page')
        if (i == page) {
            switchbutton.classList.add("active")
            switchbutton.disabled = true
        }
        switchpage.appendChild(switchbutton)
    }
    // “下一页”按钮（仅在当前页小于最大页数时显示）
    if (page < buttonlength) {
        const nextpagebutton = document.createElement('button')
        nextpagebutton.classList.add('next-page')
        nextpagebutton.innerText = '下一页'
        switchpage.appendChild(nextpagebutton)
    }
}
//点击按钮切换商家页面
function switchshopbox(whologin) {
    const switchPageContainer = document.querySelector('.shopbox .switch-page')
    switchPageContainer.replaceWith(switchPageContainer.cloneNode(true))
    const newSwitchPageContainer = document.querySelector('.shopbox .switch-page')
    newSwitchPageContainer.addEventListener('click', function (event) {
        const target = event.target
        const nowPage = Number(document.querySelector('.shopbox .switch-page .active').innerText)
        switch (true) {
            case target.classList.contains('number-page'):
                shopSearch('/SwitchManagerShopbox', Number(target.innerText), whologin)
                break
            case target.classList.contains('before-page') && nowPage > 1:
                shopSearch('/SwitchManagerShopbox', nowPage - 1, whologin)
                break
            case target.classList.contains('next-page'):
                shopSearch('/SwitchManagerShopbox', nowPage + 1, whologin)
                break
        }
    })
}
//商家筛选
async function shopSearch(url, pageNum, whologin) {
    const searchUserInput = document.querySelector('.shopbox .searchbox input')
    //搜索的类型
    const inputSelect = document.querySelector('.shopbox .searchbox .select-input')
    const query = searchUserInput.value.trim()
    const selectedInput = inputSelect.value
    const offset = (pageNum - 1) * 10
    const limit = 10
    // 如果既没输入内容，又选择了 "全部"，就查询所有订单
    if (!query) {
        await showManagerShop(offset, limit, pageNum, whologin)
        return
    }
    const requestBody = {
        searchUserinput: query,
        selectedInput,
        email: whologin.email,
        name: whologin.name,
        offset,
        limit
    }
    const res = await fetchdatas(url, requestBody)
    renderManagerShop(res.data, res.datalength, pageNum, whologin)
}
//搜索商家
function searchShop(whologin) {
    const searchProductbutton = document.querySelector('.shopbox .searchbox .searchbutton')
    const searchUserInput = document.querySelector('.shopbox .searchbox input')
    searchProductbutton.addEventListener('click', function () {
        shopSearch('/ManagerSearchShop', 1, whologin)
    })
    searchUserInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            shopSearch('/ManagerSearchShop', 1, whologin)
        }
    })
}
//添加商家
function addshop(whologin) {
    const confirmbtn = document.querySelector('#shopboxaddshopOverlay .confirm-btn')
    confirmbtn.addEventListener('click', async function () {
        const message = document.querySelector('#shopboxfinishOverlay p')
        const shopname = document.querySelector('#shopboxaddshopOverlay .shopname')
        const shopemail = document.querySelector('#shopboxaddshopOverlay .shopemail')
        const shoppwd = document.querySelector('#shopboxaddshopOverlay .shoppwd')
        const shopnameValue = shopname.value.trim()
        const shopemailValue = shopemail.value.trim()
        const shoppwdValue = shoppwd.value.trim()
        if (!shopnameValue || !shopemailValue || !shoppwdValue) {
            message.innerText = `请输入完整的商家信息`
            openModal('shopboxfinishOverlay')
            return
        }
        const qqEmailRegex = /^[1-9][0-9]{4,10}@qq\.com$/
        if (!qqEmailRegex.test(shopemailValue)) {
            message.innerText = `请输入有效的 QQ 邮箱`
            openModal('shopboxfinishOverlay')
            return
        }
        if (shoppwdValue.length < 6 || shoppwdValue.length > 18) {
            message.innerText = `密码长度必须在 6-18 位之间`
            openModal('shopboxfinishOverlay')
            return
        }
        const requestBody = {
            name: whologin.name,
            email: whologin.email,
            shopemail: shopemailValue,
            shoppwd: shoppwdValue,
            shopname: shopnameValue
        }
        const res = await fetchdatas('addshop', requestBody)
        message.innerText = res.message
        if (res.success) {
            resetaddshopbox()
        }
        openModal('shopboxfinishOverlay')
    })
}
//重置添加商家输入框
function resetaddshopbox() {
    closeModal('shopboxaddshopOverlay')
    const shopname = document.querySelector('#shopboxaddshopOverlay .shopname')
    const shopemail = document.querySelector('#shopboxaddshopOverlay .shopemail')
    const shoppwd = document.querySelector('#shopboxaddshopOverlay .shoppwd')
    shopname.value = ''
    shopemail.value = ''
    shoppwd.value = ''
}
//重置商家密码/删除商家
function operateshop(whologin) {
    const shopboxconfirmOverlay = document.querySelector('#shopboxconfirmOverlay')
    const confirmMessage = shopboxconfirmOverlay.querySelector('.shopemail')
    const confirmTitle = shopboxconfirmOverlay.querySelector('h2')
    let confirmButton = shopboxconfirmOverlay.querySelector('.confirm-btn')
    document.querySelectorAll('.shopbox .shops .shop .resetpwd,.shopbox .shops .shop .deleteshop')
        .forEach(button => {
            button.addEventListener('click', function () {
                const shop = button.closest('.shop')
                const shopemail = shop.getAttribute("id")
                const isReset = button.classList.contains('resetpwd')
                confirmTitle.innerText = isReset ? '重置密码' : '删除商家'
                confirmMessage.innerText = `商家邮箱：${shopemail}`
                const newConfirmButton = confirmButton.cloneNode(true)
                newConfirmButton.innerText = isReset ? '确定重置' : '确认删除'
                confirmButton.replaceWith(newConfirmButton)
                confirmButton = newConfirmButton
                newConfirmButton.addEventListener('click', async function () {
                    const message = document.querySelector('#shopboxfinishOverlay p')
                    const requestBody = {
                        name: whologin.name,
                        email: whologin.email,
                        shopemail: shopemail
                    }
                    const res = await fetchdatas(isReset ? 'resetshoppwd' : 'deleteshop', requestBody)
                    message.innerText = res.message
                    if (res.success) {
                        closeModal('shopboxconfirmOverlay')
                        if (!isReset) {
                            shop.remove()
                        }
                    }
                    openModal('shopboxfinishOverlay')
                })
                openModal('shopboxconfirmOverlay')
            })
        })
}
//查看商家销售详情
function showshopchart() {
    document.querySelectorAll('.shopbox .shops .shop .shopchart').forEach(button => {
        button.addEventListener('click', async function () {
            const shop = button.closest('.shop')
            const shopemail = shop.getAttribute("id")
            const shopname = shop.querySelector(".shopname")
            document.getElementById('goshopbox').classList.remove('active')
            document.getElementById('goshopchartbox')?.classList.add('active')
            document.querySelector('.shopchartbox .shopemail').innerText = `商家邮箱：${shopemail}`
            document.querySelector('.shopchartbox .shopname').innerText = `商家名称：${shopname.innerText}`
            const requestBody = {
                email: shopemail,
            }
            const data = await fetchdatas('/shopSalesData', requestBody)
            shoprenderCharts(data)
            // 监听窗口大小变化，重新渲染图表
            window.addEventListener('resize', () => shoprenderCharts(data))
        })
    })
}
//返回商家主页
function gobackshopbox() {
    document.querySelector('.shopchartbox .shopchartboxhead button').addEventListener('click', function () {
        document.getElementById('goshopbox').classList.add('active')
        document.getElementById('goshopchartbox')?.classList.remove('active')
    })
}
//--------------------------------------
let MChartA, MChartB, MChartC;
//获取销售数据
async function showManagerChart(whologin) {
    const requestBody = {
        email: whologin.Emailtext,
        name: whologin.name,
    }
    const data = await fetchdatas('/managerSalesData', requestBody)
    managerrenderCharts(data)
    // 监听窗口大小变化，重新渲染图表
    window.addEventListener('resize', () => managerrenderCharts(data))
}
//渲染图表
function managerrenderCharts(data) {
    const categoryChart = document.querySelector('.chartbox .categoryChart')
    const sevendayChart = document.querySelector('.chartbox .sevendayChart')
    const productChart = document.querySelector('.chartbox .productChart')
    const dpr = window.devicePixelRatio < 1.25 ? 1.25 : window.devicePixelRatio
    categoryChart.width = categoryChart.offsetWidth * dpr
    categoryChart.height = categoryChart.offsetHeight * dpr
    sevendayChart.width = sevendayChart.offsetWidth * dpr
    sevendayChart.height = sevendayChart.offsetHeight * dpr
    productChart.width = productChart.offsetWidth * dpr
    productChart.height = productChart.offsetHeight * dpr
    // 获取上下文
    const categoryChartCtx = categoryChart.getContext('2d')
    const sevendayChartCtx = sevendayChart.getContext('2d')
    const productChartCtx = productChart.getContext('2d')
    // 如果已经有图表实例，销毁它
    if (MChartA) {
        MChartA.destroy()
    }
    if (MChartB) {
        MChartB.destroy()
    }
    if (MChartC) {
        MChartC.destroy()
    }
    //销售人员图
    MChartA = new Chart(categoryChartCtx, {
        type: 'bar',
        data: {
            labels: data.shop.email, // x轴的类别
            datasets: [
                {
                    label: '销售量', // 左侧 Y 轴
                    data: data.shop.totalCounts, // 销售量数据
                    backgroundColor: 'rgba(54, 235, 75, 0.6)',
                    yAxisID: 'y-axis-left' // 绑定到左侧 Y 轴
                },
                {
                    label: '销售总额', // 右侧 Y 轴
                    data: data.shop.totalSales, // 销售总额数据
                    backgroundColor: 'rgba(255, 80, 64, 0.6)',
                    yAxisID: 'y-axis-right' // 绑定到右侧 Y 轴
                }
            ]

        },
        options: {
            // responsive: false,
            plugins: {
                datalabels: {
                    anchor: 'start',  // 数据标签的位置（末端）
                    align: 'top',   // 数据标签对齐方式（上方）
                    font: {
                        size: 18      // 标签字体大小
                    },
                    color: 'black',  // 标签字体颜色
                    offset: 0,  // 调整数据标签与柱子的间距，避免重叠
                    formatter: (value) => value // 显示数据值
                },
                legend: {
                    position: 'top',  // 将图例移到顶部
                    labels: {
                        font: { size: 22 }
                    },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-right': {
                    position: 'right',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                }
            },

        }
    })
    let hueOffset = 0  // 用于增加色相的偏移量，确保每次生成的颜色差异较大
    function getRandomColor() {
        hueOffset = (hueOffset + 50) % 360;  // 每次增加 30，保证色相差异
        return `hsl(${hueOffset}, 70%, 50%)`;  // 使用固定的饱和度和亮度
    }
    // 生成折线图数据集
    //Object.keys(data.sevenday).map(category=>{} 让data.sevenday的每一项都执行下面的函数
    const MChartBdatasets = Object.keys(data.sevenday).map(category => {
        const categoryData = data.sevenday[category];
        return {
            label: category,
            data: categoryData.totalCounts,
            borderColor: getRandomColor(),
            backgroundColor: "transparent",
            tension: 0.3
        }
    })
    const MChartCdatasets = Object.keys(data.sevenday).map(category => {
        const categoryData = data.sevenday[category];
        return {
            label: category,
            data: categoryData.totalSales,
            borderColor: getRandomColor(),
            backgroundColor: "transparent",
            tension: 0.3
        }
    })
    //30天内销售图
    MChartB = new Chart(sevendayChartCtx, {
        type: "line",
        data: {
            labels: data.sortedDates,
            datasets: MChartBdatasets
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'start',  // 数据标签的位置（末端）
                    align: 'top',   // 数据标签对齐方式（上方）
                    font: { size: 18 },     // 标签字体大小
                    color: 'black',  // 标签字体颜色
                    offset: 0,  // 调整数据标签与柱子的间距，避免重叠
                    formatter: (value) => value // 显示数据值
                },
                legend: {
                    position: 'top',  // 将图例移到顶部
                    labels: { font: { size: 22 } },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                y: {
                    position: 'left',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                }
            },

        }
    })
    //30天内销售图
    MChartC = new Chart(productChartCtx, {
        type: "line",
        data: {
            labels: data.sortedDates,
            datasets: MChartCdatasets
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'start',  // 数据标签的位置（末端）
                    align: 'top',   // 数据标签对齐方式（上方）
                    font: { size: 18 },     // 标签字体大小
                    color: 'black',  // 标签字体颜色
                    offset: 0,  // 调整数据标签与柱子的间距，避免重叠
                    formatter: (value) => value // 显示数据值
                },
                legend: {
                    position: 'top',  // 将图例移到顶部
                    labels: { font: { size: 22 } },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                y: {
                    position: 'left',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                }
            },

        }
    })
    //各个商品类别销售图
    //各个商品类别销售图

}
let SchartA, SchartB, SchartC;
//渲染图表
function shoprenderCharts(data) {
    const categoryChart = document.querySelector('.shopchartbox .categoryChart')
    const sevendayChart = document.querySelector('.shopchartbox .sevendayChart')
    const productChart = document.querySelector('.shopchartbox .productChart')
    const dpr = window.devicePixelRatio < 1.25 ? 1.25 : window.devicePixelRatio
    categoryChart.width = categoryChart.offsetWidth * dpr
    categoryChart.height = categoryChart.offsetHeight * dpr
    sevendayChart.width = sevendayChart.offsetWidth * dpr
    sevendayChart.height = sevendayChart.offsetHeight * dpr
    productChart.width = productChart.offsetWidth * dpr
    productChart.height = productChart.offsetHeight * dpr
    // 获取上下文
    const categoryChartCtx = categoryChart.getContext('2d')
    const sevendayChartCtx = sevendayChart.getContext('2d')
    const productChartCtx = productChart.getContext('2d')
    // 如果已经有图表实例，销毁它
    if (SchartA) {
        SchartA.destroy()
    }
    if (SchartB) {
        SchartB.destroy()
    }
    if (SchartC) {
        SchartC.destroy()
    }
    //各个商品类别销售图
    SchartA = new Chart(categoryChartCtx, {
        type: 'bar',
        data: {
            labels: data.categories.categories, // x轴的类别
            datasets: [
                {
                    label: '销售量', // 左侧 Y 轴
                    data: data.categories.totalCounts, // 销售量数据
                    backgroundColor: 'rgba(54, 235, 75, 0.6)',
                    yAxisID: 'y-axis-left' // 绑定到左侧 Y 轴
                },
                {
                    label: '销售总额', // 右侧 Y 轴
                    data: data.categories.totalSales, // 销售总额数据
                    backgroundColor: 'rgba(255, 80, 64, 0.6)',
                    yAxisID: 'y-axis-right' // 绑定到右侧 Y 轴
                }
            ]

        },
        options: {
            // responsive: false,
            plugins: {
                datalabels: {
                    anchor: 'start',  // 数据标签的位置（末端）
                    align: 'top',   // 数据标签对齐方式（上方）
                    font: {
                        size: 18      // 标签字体大小
                    },
                    color: 'black',  // 标签字体颜色
                    offset: 0,  // 调整数据标签与柱子的间距，避免重叠
                    formatter: (value) => value // 显示数据值
                },
                legend: {
                    position: 'top',  // 将图例移到顶部
                    labels: {
                        font: { size: 22 }
                    },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-right': {
                    position: 'right',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                }
            },

        }
    })

    //30天内销售图
    SchartB = new Chart(sevendayChartCtx, {
        type: 'line',
        data: {
            labels: data.sevenday.dates,
            datasets: [
                {
                    label: '销售量趋势',
                    data: data.sevenday.totalCounts,
                    borderColor: 'blue',
                    fill: false,
                    yAxisID: 'y-axis-left',
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        font: {
                            size: 18
                        },

                        color: 'black',
                        formatter: (value) => value
                    }
                },
                {
                    label: '销售总额趋势',
                    data: data.sevenday.totalSales,
                    borderColor: 'rgba(255, 159, 64, 0.6)',
                    fill: false,
                    yAxisID: 'y-axis-right',
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        font: {
                            size: 18
                        },

                        color: 'black',
                        formatter: (value) => value
                    }
                }
            ]
        },
        options: {
            // responsive: false,
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        },
                        padding: 30
                    },
                    offset: true
                },
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-right': {
                    position: 'right',
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 18
                        }
                    }, offset: true
                },
                tooltip: {
                    titleFont: {
                        size: 18
                    },
                    bodyFont: {
                        size: 18
                    }
                }
            }
        }
    })
    //各个商品类别销售图
    SchartC = new Chart(productChartCtx, {
        type: 'bar',
        data: {
            labels: data.product.id, // x轴的类别
            datasets: [
                {
                    label: '销售量', // 左侧 Y 轴
                    data: data.product.totalCounts, // 销售量数据
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    yAxisID: 'y-axis-left' // 绑定到左侧 Y 轴
                }
            ]
        },
        options: {
            // responsive: false,
            plugins: {
                datalabels: {
                    anchor: 'start',  // 数据标签的位置（末端）
                    align: 'top',   // 数据标签对齐方式（上方）
                    font: {
                        size: 18      // 标签字体大小
                    },
                    color: 'black',  // 标签字体颜色
                    offset: 0,  // 调整数据标签与柱子的间距，避免重叠
                    formatter: (value) => value // 显示数据值
                },
                legend: {
                    position: 'top',  // 将图例移到顶部
                    labels: {
                        font: { size: 22 }
                    },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                }
            }
        }
    })
}