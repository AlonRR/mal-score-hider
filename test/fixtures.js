// Hand-written minimal pages, shaped like the markup recorded in docs/survey.md. Not copies of
// MyAnimeList pages: only the elements and classes the extension looks at, with made-up numbers.

export const ENTRY_URL = 'https://myanimelist.net/anime/5114/Example';

export const entry = ({ myScore = '0' } = {}) => `
<div id="content"><table><tbody><tr>
<td class="borderClass"><div class="leftside">
  <select id="myinfo_score" class="inputtext">
    <option value="0" ${myScore === '0' ? 'selected' : ''}>Select</option>
    <option value="9" ${myScore === '9' ? 'selected' : ''}>(9) Great</option>
    <option value="10" ${myScore === '10' ? 'selected' : ''}>(10) Masterpiece</option>
  </select>
  <h2>Statistics</h2>
  <div itemprop="aggregateRating" class="spaceit_pad po-r js-statistics-info di-ib" data-id="info1">
    <span class="dark_text">Score:</span>
    <span itemprop="ratingValue" class="score-label score-9">9.11</span><sup>1</sup>
    (scored by <span itemprop="ratingCount" style="display: none">2353020</span>2,353,020 users)
    <meta itemprop="bestRating" content="10">
    <div class="statistics-info info1"><small><sup>1</sup> indicates a weighted score.</small></div>
  </div>
  <div class="spaceit_pad po-r js-statistics-info di-ib" data-id="info2">
    <span class="dark_text">Ranked:</span> #2<sup>2</sup>
    <div class="statistics-info info2"><small><sup>2</sup> based on the top anime page.</small></div>
  </div>
  <div class="spaceit_pad"><span class="dark_text">Popularity:</span> #3</div>
  <div class="spaceit_pad"><span class="dark_text">Members:</span> 3,754,732</div>
  <div class="spaceit_pad"><span class="dark_text">Favorites:</span> 230,001</div>
</div></td>
<td><div class="rightside">
  <div class="stats-block po-r clearfix">
    <div class="fl-l score" data-title="score" data-user="2,353,020 users"><div class="score-label score-9">9.11</div></div>
    <div class="di-ib ml12 pl20 pt8">
      <span class="numbers ranked">Ranked <strong>#2</strong></span>
      <span class="numbers popularity">Popularity <strong>#3</strong></span>
      <span class="numbers members">Members <strong>3,754,732</strong></span>
    </div>
  </div>
  <div class="review-element"><div class="text">A review.</div>
    <div class="rating mt20 mb20 js-hidden"> Reviewer’s Rating: <span class="num">10</span></div>
  </div>
  <a class="hoverinfo_trigger" href="/anime/9253/Other">Other show</a>
</div></td>
</tr></tbody></table></div>`;

// The hover popup MAL fills in after the page has loaded, here for show 9253.
export const hoverPopup = `
<div class="hoverinfo-contaniner">
  <div><a class="hovertitle" href="https://myanimelist.net/anime/9253/Other">Other show (2011)</a></div>
  <div>A synopsis.</div>
  <span class="dark_text">Type:</span> TV<br>
  <span class="dark_text">Score:</span> 9.07 <small>(scored by 1,500,000 users)</small><br>
  <span class="dark_text">Ranked:</span> #3<br>
  <span class="dark_text">Popularity:</span> #13<br>
  <span class="dark_text">Members:</span> 2,868,458<br>
</div>`;

export const stats = `
<div class="leftside"><select id="myinfo_score"><option value="0" selected>Select</option></select></div>
<div class="rightside">
  <h2>Score Stats</h2>
  <table class="score-stats"><tbody>
    <tr><td class="score-label score-10">10</td><td><div class="spaceit_pad"><div class="updatesBar"></div><span>48.8% <small>(1147155 votes)</small></span></div></td></tr>
    <tr><td class="score-label score-9">9</td><td><div class="spaceit_pad"><div class="updatesBar"></div><span>27.3% <small>(641000 votes)</small></span></div></td></tr>
  </tbody></table>
</div>`;

export const topAnime = `
<table class="top-ranking-table"><tbody>
<tr class="table-header"><td class="rank">Rank</td><td class="title">Title</td><td class="score">Score</td><td class="your-score">Your Score</td><td class="status">Status</td></tr>
<tr class="ranking-list">
  <td class="rank ac"><span class="lightLink top-anime-rank-text rank1">1</span></td>
  <td class="title al va-t word-break"><a class="hoverinfo_trigger" href="https://myanimelist.net/anime/52991/First"></a>
    <div class="detail"><h3 class="anime_ranking_h3"><a class="hoverinfo_trigger" href="https://myanimelist.net/anime/52991/First">First show</a></h3>
    <div class="information di-ib mt4">TV (28 eps)<br>Sep 2023 - Mar 2024<br>1,543,101 members<br></div></div></td>
  <td class="score ac fs14"><div class="js-top-ranking-score-col top-ranking-score-col di-ib al"><i class="icon-score-star"></i><span class="text on score-label score-9">9.24</span></div></td>
  <td class="your-score ac fs14"><div class="js-top-ranking-your-score-col"><a class="Lightbox_AddEdit" href="https://myanimelist.net/ownlist/anime/52991/edit"><i class="icon-score-star"></i><span class="text on score-label score-10">10</span></a></div></td>
  <td class="status ac"><a class="Lightbox_AddEdit">Completed</a></td>
</tr>
<tr class="ranking-list">
  <td class="rank ac"><span class="lightLink top-anime-rank-text rank2">2</span></td>
  <td class="title al va-t word-break"><a class="hoverinfo_trigger" href="https://myanimelist.net/anime/5114/Second"></a>
    <div class="detail"><h3 class="anime_ranking_h3"><a class="hoverinfo_trigger" href="https://myanimelist.net/anime/5114/Second">Second show</a></h3>
    <div class="information di-ib mt4">TV (64 eps)<br>Apr 2009 - Jul 2010<br>3,755,276 members<br></div></div></td>
  <td class="score ac fs14"><div class="js-top-ranking-score-col top-ranking-score-col di-ib al"><i class="icon-score-star"></i><span class="text on score-label score-9">9.11</span></div></td>
  <td class="your-score ac fs14"><div class="js-top-ranking-your-score-col"><a class="Lightbox_AddEdit" href="https://myanimelist.net/ownlist/anime/5114/edit"><i class="icon-score-star"></i><span class="text score-label score-na">N/A</span></a></div></td>
  <td class="status ac"><a class="Lightbox_AddEdit">Add to list</a></td>
</tr>
</tbody></table>`;

const tile = (id, score, members) => `
<div class="js-anime-category-producer seasonal-anime js-seasonal-anime">
  <div class="title"><a href="https://myanimelist.net/anime/${id}/Tile">Tile ${id}</a></div>
  <div class="scormem-container">
    <div class="scormem-item score score-label score-8"><i class="fa-regular fa-star mr4"></i>${score}</div>
    <div class="scormem-item member"><i class="fa-solid fa-user mr4"></i>${members}</div>
  </div>
  <span style="display: none" class="js-score">${score}</span>
</div>`;

export const seasonal = `<div class="seasonal-anime-list">${tile(1, '8.61', '1.2M')}${tile(2, '7.05', '310K')}</div>`;

export const producer = `
<div class="js-categories-seasonal tile-anime-list">
  <div class="js-anime-category-studio seasonal-anime js-seasonal-anime">
    <div class="title"><a href="https://myanimelist.net/anime/5114/Studio">Studio show</a></div>
    <div class="widget"><div class="stars">9.11<i class="fa-regular fa-star"></i></div><div class="users">3,755,276<i class="fa-solid fa-user"></i></div></div>
  </div>
</div>`;

// The anime search, and the list view of a genre page: a plain table, the score column found by its header.
export const searchTable = `
<div id="content"><table><tbody>
<tr><td class="borderClass bgColor1"></td><td class="borderClass bgColor1 ac fw-b">Title</td>
  <td class="borderClass bgColor1 ac fw-b"><a href="?o=6">Type<i></i></a></td>
  <td class="borderClass bgColor1 ac fw-b"><a href="?o=4">Eps.<i></i></a></td>
  <td class="borderClass bgColor1 ac fw-b"><a href="?o=3">Score<i></i></a></td>
  <td class="borderClass bgColor1 ac fw-b"><a href="?o=7">Members<i></i></a></td></tr>
<tr><td class="borderClass bgColor0"><a class="hoverinfo_trigger" href="https://myanimelist.net/anime/5114/Search"></a></td>
  <td class="borderClass bgColor0"><a class="hoverinfo_trigger fw-b" href="https://myanimelist.net/anime/5114/Search"><strong>Search show</strong></a></td>
  <td class="borderClass ac bgColor0"> TV </td><td class="borderClass ac bgColor0"> 64 </td>
  <td class="borderClass ac bgColor0"> 9.11 </td><td class="borderClass ac bgColor0"> 3,755,276 </td></tr>
</tbody></table></div>`;

export const searchAll = `
<div class="list di-t w100">
  <div class="information di-tc va-t pt4 pl8">
    <div class="title"><a class="hoverinfo_trigger fw-b" href="https://myanimelist.net/anime/5114/All">All-search show</a></div>
    <div class="pt8 fs10 lh14 fn-grey4"> <a href="https://myanimelist.net/topanime.php?type=tv">TV</a> (64 eps)<br> Scored 9.11<br> 3,755,276 members<br> </div>
  </div>
</div>`;
