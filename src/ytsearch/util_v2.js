const URL = require('url');
const VIDEO_URL = 'https://www.youtube.com/watch?v=';

exports.mapJSON = (json) => {
    const wrapper = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer;
    const filters = wrapper.subMenu.searchSubMenuRenderer.groups;
    const items = wrapper.contents.find(x => Object.keys(x)[0] === 'itemSectionRenderer').itemSectionRenderer.contents;
    //const continuation = wrapper.contents.find(x => Object.keys(x)[0] === 'continuationItemRenderer').continuationItemRenderer;

    return {
        query: null,
        items: [].concat(items.map(parseItem).filter(x => x !== null)),
        nextpageRef: null, // continuation,
        results: json.estimatedResults,
        filters: filters,
        currentRef: null,
    }
}

let log = 0;
const parseItem = (item) => {
    const type = Object.keys(item)[0];
    if (type === 'videoRenderer') {
        const author = item[type].ownerText.runs[0];
        const isLive = Array.isArray(item[type].badges) && item[type].badges.some(a => a.metadataBadgeRenderer.label === 'LIVE NOW');
        return {
            link: VIDEO_URL + item[type].videoId,
            type: 'video',
            live: isLive,
            title: item[type].title.runs[0].text,

            thumbnail: item[type].thumbnail.thumbnails.sort((a, b) => b.width - a.width)[0].url,
            author: {
                name: author.text,
                ref: URL.resolve(VIDEO_URL, author.navigationEndpoint.commandMetadata.webCommandMetadata.url),
                verified: Array.isArray(item[type].ownerBadges) && item[type].ownerBadges.some(a => a.metadataBadgeRenderer.tooltip === 'Verified'),
            },
            description: item[type].descriptionSnippet ? item[type].descriptionSnippet.runs.map(a => a.text).join('') : null,
            views: item[type].viewCountText ? item[type].viewCountText.simpleText : null,
            duration: item[type].lengthText ? item[type].lengthText.simpleText : null,
            uploaded_at: item[type].publishedTimeText ? item[type].publishedTimeText.simpleText : null,
        };
    } else {
        return null;
    }
}