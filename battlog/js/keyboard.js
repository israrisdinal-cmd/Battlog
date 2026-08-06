// js/keyboard.js - V1.5.11 Keyboard Logic (yang kamu bilang sempurna)
export function initKeyboardFix(){
  const nav = document.querySelector('.bottom-nav');
  const isInput = el => el && (el.tagName==='INPUT' || el.tagName==='SELECT' || el.tagName==='TEXTAREA');
  let lastScrollTime = 0;

  document.addEventListener('focusin', e=>{
    const t=e.target;
    if(!isInput(t)) return;
    if(nav) nav.classList.add('keyboard-open');
    const now=Date.now();
    if(now-lastScrollTime < 800) return;
    lastScrollTime=now;
    setTimeout(()=>{
      try{
        const parent = t.closest('#view-catat, #view-riwayat, #view-dasbor') || document.scrollingElement;
        if(parent){
          const rect = t.getBoundingClientRect();
          if(rect.bottom > window.innerHeight * 0.6){
            const delta = rect.bottom - window.innerHeight*0.6 + 20;
            if(parent===document.scrollingElement){
              window.scrollBy({top: delta, behavior: 'auto'});
            } else {
              parent.scrollBy({top: delta, behavior: 'auto'});
            }
          }
        }
      }catch(_){}
    }, 300);
  }, {passive:true});

  document.addEventListener('focusout', ()=>{
    setTimeout(()=>{
      const a=document.activeElement;
      if(!isInput(a)){
        if(nav) nav.classList.remove('keyboard-open');
      }
    }, 150);
  });

  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', ()=>{
      const diff = window.innerHeight - window.visualViewport.height;
      if(diff > 120){
        if(nav) nav.classList.add('keyboard-open');
      } else if(diff < 80){
        const a=document.activeElement;
        if(!isInput(a) && nav) nav.classList.remove('keyboard-open');
      }
    });
  }
}
