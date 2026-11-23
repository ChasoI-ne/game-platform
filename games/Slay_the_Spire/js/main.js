/* ============================================================
   MAIN — bootstrap
   ============================================================ */
(function(root){
  'use strict';
  function boot(){
    try{
      if(!root.GAME_DATA || !root.Game || !root.UI){
        document.getElementById('app').innerHTML='<div style="padding:40px;color:#e6dcc0;font-family:Georgia,serif">ゲームの読み込みに失敗しました。js/data.js、js/ja.js、js/engine.js、js/ui.js が存在することを確認してください。</div>';
        return;
      }
      const game=new root.Game();
      root.UI.init(game);
      game.ui=root.UI;
      root.STYLES=game; // handy for debugging in console
      root.UI.render();
    }catch(err){
      console.error(err);
      document.getElementById('app').innerHTML='<div style="padding:40px;color:#e6dcc0;font-family:Georgia,serif">起動中にエラーが発生しました: '+String(err&&err.message||err)+'</div>';
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})(window);
