/* Shared entry-editor keyboard policy; saving/discarding stays in Navigation. */
const EditorKeys=(()=>{
 function textField(element){if(!(element instanceof HTMLElement))return null;if(element.matches('textarea,input:not([type]),input[type=text],input[type=search],input[type=email],input[type=url],input[type=tel],input[type=number],input[type=date],input[type=time],input[type=datetime-local],input[type=month],input[type=week]'))return element;if(element.isContentEditable)return element.closest('[contenteditable=true]');return null;}
 function fields(editor=$('editor')){return [...editor.querySelectorAll('input,textarea,[contenteditable=true]')].filter(el=>textField(el)===el&&!el.disabled&&!el.readOnly&&!el.closest('[hidden],[inert],details:not([open])')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');}
 function next(current,editor=$('editor')){const list=fields(editor),index=list.indexOf(current),target=index>=0?list[index+1]:null;(target||(editor.id==='editor'?$('save-entry'):editor.querySelector('button[type=submit]')))?.focus();}
 function init(editor=$('editor')){editor.tabIndex=-1;editor.addEventListener('pointerdown',event=>{if(event.button!==0||!(event.target instanceof Element)||event.target.closest('input,textarea,select,button,a,label,summary,[contenteditable],[role=option]'))return;editor.focus({preventScroll:true});});
  editor.addEventListener('keydown',event=>{if(event.defaultPrevented||event.isComposing||event.key!=='Enter'||event.altKey||event.ctrlKey||event.metaKey)return;const field=textField(event.target);if(!field||!editor.contains(field))return;if(event.shiftKey){if(field.tagName!=='TEXTAREA')event.preventDefault();return;}event.preventDefault();next(field,editor);});
 }
 return {init,next};
})();
