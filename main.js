const Apify = require('apify');
const moment = require('moment');

const MAX_CALLS_PER_SECOND = 20;
let callsThisSecond = 0

const waitForThrottle = async () => {
    while(callsThisSecond > MAX_CALLS_PER_SECOND) {
        await new Promise(resolve => setTimeout(resolve, 50))
    }
}

const clearThrottle = setInterval(() => {
    callsThisSecond = 0
}, 1000)

const getAllActors = async (acts, items, offset) => {
    callsThisSecond ++
    await waitForThrottle()
    const newItems = await acts.listActs({
        offset,
    }).then(res => res.items);
    items = items.concat(newItems)
    if (newItems.length === 0) {
        return items
    }
    return getAllActors(acts, items, offset + 1000)
}

const getRuns = async (acts, items, offset, actId, dateFrom) => {
    callsThisSecond ++
    await waitForThrottle()
    const newItems = await acts.listRuns({
        offset,
        desc: true,
        actId
    }).then(res => res.items);
    items = items.concat(newItems)
    if (newItems.length === 0) {
        return items
    }
    const lastRunDate = new Date(newItems[newItems.length -1].startedAt)
    console.log('last run date', lastRunDate)
    if (dateFrom > lastRunDate) {
        return items
    }
    return getRuns(acts, items, offset + 1000, actId, dateFrom)
}

Apify.main(async() => {
    const input = await Apify.getValue('INPUT')
    console.log('input')
    console.dir(input)

    const { acts } = Apify.client
    let dateFrom
    let dateTo
    if (input.checkTime === 'last-day') {
        dateFrom = moment().subtract(1,'days').startOf('day')
        dateTo = moment().startOf('day')
    }
    if (input.checkTime === 'last-month') {
        dateFrom = moment().subtract(1,'months').startOf('month')
        dateTo = moment().startOf('month')
    }
    const stats = {};

    console.log('Date from')
    console.log(dateFrom)
    console.log('Date to')
    console.log(dateTo)

    const myActors = await getAllActors(acts, [], 0)
    console.log(`I have ${myActors.length} actors`)
    for (const myActor of myActors) {
        console.log('checking actor:', myActor.name)
        const myRuns = await getRuns(acts, [], 0, myActor.id, dateFrom)
        console.log('runs loaded', myRuns.length)
        const filteredRuns = myRuns.filter(run => new Date(run.startedAt) >= dateFrom && new Date(run.startedAt) < dateTo);
        console.log('runs last day', filteredRuns.length)
        let sumCU = 0
        for (const run of filteredRuns) {
            callsThisSecond ++
            await waitForThrottle()
            const runInfo = await acts.getRun({
                actId: myActor.id,
                runId: run.id,
            })
            sumCU += runInfo.stats.computeUnits
        }
        console.log('CUs:', sumCU)
        stats[myActor.name] = sumCU
    }

    await Apify.setValue('OUTPUT', stats)
})