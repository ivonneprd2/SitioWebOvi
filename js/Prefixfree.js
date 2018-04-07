1  /** 
2  * StyleFix 1.0.3 & PrefixFree 1.0.7 
3  * @author Lea Verou 
4  * MIT license 
5  */ 
6 
 
7 (function(){ 
8 
 
9 if(!window.addEventListener) { 
10 	return; 
11 } 
12 
 
13 var self = window.StyleFix = { 
14 	link: function(link) { 
15 		var url = link.href || link.getAttribute('data-href'); 
16 		try { 
17 			// Ignore stylesheets with data-noprefix attribute as well as alternate stylesheets or without (data-)href attribute 
18 			if(!url || link.rel !== 'stylesheet' || link.hasAttribute('data-noprefix')) { 
19 				return; 
20 			} 
21 		} 
22 		catch(e) { 
23 			return; 
24 		} 
25 
 
26 		var base = url.replace(/[^\/]+$/, ''), 
27 		    base_scheme = (/^[a-z]{3,10}:/.exec(base) || [''])[0], 
28 		    base_domain = (/^[a-z]{3,10}:\/\/[^\/]+/.exec(base) || [''])[0], 
29 		    base_query = /^([^?]*)\??/.exec(url)[1], 
30 		    parent = link.parentNode, 
31 		    xhr = new XMLHttpRequest(), 
32 		    process; 
33 
 
34 		xhr.onreadystatechange = function() { 
35 			if(xhr.readyState === 4) { 
36 				process(); 
37 			} 
38 		}; 
39 
 
40 		process = function() { 
41 				var css = xhr.responseText; 
42 
 
43 				if(css && link.parentNode && (!xhr.status || xhr.status < 400 || xhr.status > 600)) { 
44 					css = self.fix(css, true, link); 
45 
 
46 					// Convert relative URLs to absolute, if needed 
47 					if(css && base) { 
48 						css = css.replace(/url\(\s*?((?:"|')?)(.+?)\1\s*?\)/gi, function($0, quote, url) { 
49 							if(/^([a-z]{3,10}:|#)/i.test(url)) { // Absolute & or hash-relative 
50 								return $0; 
51 							} 
52 							else if(/^\/\//.test(url)) { // Scheme-relative 
53 								// May contain sequences like /../ and /./ but those DO work 
54 								return 'url("' + base_scheme + url + '")'; 
55 							} 
56 							else if(/^\//.test(url)) { // Domain-relative 
57 								return 'url("' + base_domain + url + '")'; 
58 							} 
59 							else if(/^\?/.test(url)) { // Query-relative 
60 								return 'url("' + base_query + url + '")'; 
61 							} 
62 							else { 
63 								// Path-relative 
64 								return 'url("' + base + url + '")'; 
65 							} 
66 						}); 
67 
 
68 						// behavior URLs shoudn’t be converted (Issue #19) 
69 						// base should be escaped before added to RegExp (Issue #81) 
70 						var escaped_base = base.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g,"\\$1"); 
71 						css = css.replace(RegExp('\\b(behavior:\\s*?url\\(\'?"?)' + escaped_base, 'gi'), '$1'); 
72 						} 
73 
 
74 					var style = document.createElement('style'); 
75 					style.textContent = '/*# sourceURL='+link.getAttribute('href')+' */\n/*@ sourceURL='+link.getAttribute('href')+' */\n' + css; 
76 					style.media = link.media; 
77 					style.disabled = link.disabled; 
78 					style.setAttribute('data-href', link.getAttribute('href')); 
79 
 
80 					if(link.id) style.id = link.id; 
81 
 
82 					parent.insertBefore(style, link); 
83 					parent.removeChild(link); 
84 
 
85 					style.media = link.media; // Duplicate is intentional. See issue #31 
86 				} 
87 		}; 
88 
 
89 		try { 
90 			xhr.open('GET', url); 
91 			xhr.send(null); 
92 		} catch (e) { 
93 			// Fallback to XDomainRequest if available 
94 			if (typeof XDomainRequest != "undefined") { 
95 				xhr = new XDomainRequest(); 
96 				xhr.onerror = xhr.onprogress = function() {}; 
97 				xhr.onload = process; 
98 				xhr.open("GET", url); 
99 				xhr.send(null); 
100 			} 
101 		} 
102 
 
103 		link.setAttribute('data-inprogress', ''); 
104 	}, 
105 
 
106 	styleElement: function(style) { 
107 		if (style.hasAttribute('data-noprefix')) { 
108 			return; 
109 		} 
110 		var disabled = style.disabled; 
111 
 
112 		style.textContent = self.fix(style.textContent, true, style); 
113 
 
114 		style.disabled = disabled; 
115 	}, 
116 
 
117 	styleAttribute: function(element) { 
118 		var css = element.getAttribute('style'); 
119 
 
120 		css = self.fix(css, false, element); 
121 
 
122 		element.setAttribute('style', css); 
123 	}, 
124 
 
125 	process: function() { 
126 		// Linked stylesheets 
127 		$('link[rel="stylesheet"]:not([data-inprogress])').forEach(StyleFix.link); 
128 
 
129 		// Inline stylesheets 
130 		$('style').forEach(StyleFix.styleElement); 
131 
 
132 		// Inline styles 
133 		$('[style]').forEach(StyleFix.styleAttribute); 
134 		 
135 		var event = document.createEvent('Event'); 
136 		event.initEvent('StyleFixProcessed', true, true); 
137 		document.dispatchEvent(event); 
138 
 
139 	}, 
140 
 
141 	register: function(fixer, index) { 
142 		(self.fixers = self.fixers || []) 
143 			.splice(index === undefined? self.fixers.length : index, 0, fixer); 
144 	}, 
145 
 
146 	fix: function(css, raw, element) { 
147 		if(self.fixers) { 
148 		  for(var i=0; i<self.fixers.length; i++) { 
149 			css = self.fixers[i](css, raw, element) || css; 
150 		  } 
151 		} 
152 
 
153 		return css; 
154 	}, 
155 
 
156 	camelCase: function(str) { 
157 		return str.replace(/-([a-z])/g, function($0, $1) { return $1.toUpperCase(); }).replace('-',''); 
158 	}, 
159 
 
160 	deCamelCase: function(str) { 
161 		return str.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase() }); 
162 	} 
163 }; 
164 
 
165 /************************************** 
166  * Process styles 
167  **************************************/ 
168 (function(){ 
169 	setTimeout(function(){ 
170 		$('link[rel="stylesheet"]').forEach(StyleFix.link); 
171 	}, 10); 
172 
 
173 	document.addEventListener('DOMContentLoaded', StyleFix.process, false); 
174 })(); 
175 
 
176 function $(expr, con) { 
177 	return [].slice.call((con || document).querySelectorAll(expr)); 
178 } 
179 
 
180 })(); 
181 
 
182 /** 
183  * PrefixFree 
184  */ 
185 (function(root){ 
186 
 
187 if(!window.StyleFix || !window.getComputedStyle) { 
188 	return; 
189 } 
190 
 
191 // Private helper 
192 function fix(what, before, after, replacement, css) { 
193 	what = self[what]; 
194 
 
195 	if(what.length) { 
196 		var regex = RegExp(before + '(' + what.join('|') + ')' + after, 'gi'); 
197 
 
198 		css = css.replace(regex, replacement); 
199 	} 
200 
 
201 	return css; 
202 } 
203 
 
204 var self = window.PrefixFree = { 
205 	prefixCSS: function(css, raw, element) { 
206 		var prefix = self.prefix; 
207 
 
208 		// Gradient angles hotfix 
209 		if(self.functions.indexOf('linear-gradient') > -1) { 
210 			// Gradients are supported with a prefix, convert angles to legacy 
211 			css = css.replace(/(\s|:|,)(repeating-)?linear-gradient\(\s*(-?\d*\.?\d*)deg/ig, function ($0, delim, repeating, deg) { 
212 				return delim + (repeating || '') + 'linear-gradient(' + (90-deg) + 'deg'; 
213 			}); 
214 		} 
215 
 
216 		css = fix('functions', '(\\s|:|,)', '\\s*\\(', '$1' + prefix + '$2(', css); 
217 		css = fix('keywords', '(\\s|:)', '(\\s|;|\\}|$)', '$1' + prefix + '$2$3', css); 
218 		css = fix('properties', '(^|\\{|\\s|;)', '\\s*:', '$1' + prefix + '$2:', css); 
219 
 
220 		// Prefix properties *inside* values (issue #8) 
221 		if (self.properties.length) { 
222 			var regex = RegExp('\\b(' + self.properties.join('|') + ')(?!:)', 'gi'); 
223 
 
224 			css = fix('valueProperties', '\\b', ':(.+?);', function($0) { 
225 				return $0.replace(regex, prefix + "$1") 
226 			}, css); 
227 		} 
228 
 
229 		if(raw) { 
230 			css = fix('selectors', '', '\\b', self.prefixSelector, css); 
231 			css = fix('atrules', '@', '\\b', '@' + prefix + '$1', css); 
232 		} 
233 
 
234 		// Fix double prefixing 
235 		css = css.replace(RegExp('-' + prefix, 'g'), '-'); 
236 
 
237 		// Prefix wildcard 
238 		css = css.replace(/-\*-(?=[a-z]+)/gi, self.prefix); 
239 
 
240 		return css; 
241 	}, 
242 
 
243 	property: function(property) { 
244 		return (self.properties.indexOf(property) >=0 ? self.prefix : '') + property; 
245 	}, 
246 
 
247 	value: function(value, property) { 
248 		value = fix('functions', '(^|\\s|,)', '\\s*\\(', '$1' + self.prefix + '$2(', value); 
249 		value = fix('keywords', '(^|\\s)', '(\\s|$)', '$1' + self.prefix + '$2$3', value); 
250 
 
251 		if(self.valueProperties.indexOf(property) >= 0) { 
252 			value = fix('properties', '(^|\\s|,)', '($|\\s|,)', '$1'+self.prefix+'$2$3', value); 
253 		} 
254 
 
255 		return value; 
256 	}, 
257 
 
258 	prefixSelector: function(selector) { 
259 		return self.selectorMap[selector] || selector 
260 	}, 
261 
 
262 	// Warning: Prefixes no matter what, even if the property is supported prefix-less 
263 	prefixProperty: function(property, camelCase) { 
264 		var prefixed = self.prefix + property; 
265 
 
266 		return camelCase? StyleFix.camelCase(prefixed) : prefixed; 
267 	} 
268 }; 
269 
 
270 /************************************** 
271  * Properties 
272  **************************************/ 
273 (function() { 
274 	var prefixes = {}, 
275 		properties = [], 
276 		shorthands = {}, 
277 		style = getComputedStyle(document.documentElement, null), 
278 		dummy = document.createElement('div').style; 
279 
 
280 	// Why are we doing this instead of iterating over properties in a .style object? Because Webkit. 
281 	// 1. Older Webkit won't iterate over those. 
282 	// 2. Recent Webkit will, but the 'Webkit'-prefixed properties are not enumerable. The 'webkit' 
283 	//    (lower case 'w') ones are, but they don't `deCamelCase()` into a prefix that we can detect. 
284 
 
285 	var iterate = function(property) { 
286 		if(property.charAt(0) === '-') { 
287 			properties.push(property); 
288 
 
289 			var parts = property.split('-'), 
290 				prefix = parts[1]; 
291 
 
292 			// Count prefix uses 
293 			prefixes[prefix] = ++prefixes[prefix] || 1; 
294 
 
295 			// This helps determining shorthands 
296 			while(parts.length > 3) { 
297 				parts.pop(); 
298 
 
299 				var shorthand = parts.join('-'); 
300 
 
301 				if(supported(shorthand) && properties.indexOf(shorthand) === -1) { 
302 					properties.push(shorthand); 
303 				} 
304 			} 
305 		} 
306 	}, 
307 	supported = function(property) { 
308 		return StyleFix.camelCase(property) in dummy; 
309 	} 
310 
 
311 	// Some browsers have numerical indices for the properties, some don't 
312 	if(style && style.length > 0) { 
313 		for(var i=0; i<style.length; i++) { 
314 			iterate(style[i]) 
315 		} 
316 	} 
317 	else { 
318 		for(var property in style) { 
319 			iterate(StyleFix.deCamelCase(property)); 
320 		} 
321 	} 
322 
 
323 	// Find most frequently used prefix 
324 	var highest = {uses:0}; 
325 	for(var prefix in prefixes) { 
326 		var uses = prefixes[prefix]; 
327 
 
328 		if(highest.uses < uses) { 
329 			highest = {prefix: prefix, uses: uses}; 
330 		} 
331 	} 
332 
 
333 	self.prefix = '-' + highest.prefix + '-'; 
334 	self.Prefix = StyleFix.camelCase(self.prefix); 
335 
 
336 	self.properties = []; 
337 
 
338 	// Get properties ONLY supported with a prefix 
339 	for(var i=0; i<properties.length; i++) { 
340 		var property = properties[i]; 
341 
 
342 		if(property.indexOf(self.prefix) === 0) { // we might have multiple prefixes, like Opera 
343 			var unprefixed = property.slice(self.prefix.length); 
344 
 
345 			if(!supported(unprefixed)) { 
346 				self.properties.push(unprefixed); 
347 			} 
348 		} 
349 	} 
350 
 
351 	// IE fix 
352 	if(self.Prefix == 'Ms' 
353 	  && !('transform' in dummy) 
354 	  && !('MsTransform' in dummy) 
355 	  && ('msTransform' in dummy)) { 
356 		self.properties.push('transform', 'transform-origin'); 
357 	} 
358 
 
359 	self.properties.sort(); 
360 })(); 
361 
 
362 /************************************** 
363  * Values 
364  **************************************/ 
365 (function() { 
366 // Values that might need prefixing 
367 var functions = { 
368 	'linear-gradient': { 
369 		property: 'backgroundImage', 
370 		params: 'red, teal' 
371 	}, 
372 	'calc': { 
373 		property: 'width', 
374 		params: '1px + 5%' 
375 	}, 
376 	'element': { 
377 		property: 'backgroundImage', 
378 		params: '#foo' 
379 	}, 
380 	'cross-fade': { 
381 		property: 'backgroundImage', 
382 		params: 'url(a.png), url(b.png), 50%' 
383 	}, 
384 	'image-set': { 
385 		property: 'backgroundImage', 
386 		params: 'url(a.png) 1x, url(b.png) 2x' 
387 	} 
388 }; 
389 
 
390 
 
391 functions['repeating-linear-gradient'] = 
392 functions['repeating-radial-gradient'] = 
393 functions['radial-gradient'] = 
394 functions['linear-gradient']; 
395 
 
396 // Note: The properties assigned are just to *test* support. 
397 // The keywords will be prefixed everywhere. 
398 var keywords = { 
399 	'initial': 'color', 
400 	'grab': 'cursor', 
401 	'grabbing': 'cursor', 
402 	'zoom-in': 'cursor', 
403 	'zoom-out': 'cursor', 
404 	'box': 'display', 
405 	'flexbox': 'display', 
406 	'inline-flexbox': 'display', 
407 	'flex': 'display', 
408 	'inline-flex': 'display', 
409 	'grid': 'display', 
410 	'inline-grid': 'display', 
411 	'max-content': 'width', 
412 	'min-content': 'width', 
413 	'fit-content': 'width', 
414 	'fill-available': 'width', 
415 	'contain-floats': 'width' 
416 }; 
417 
 
418 self.functions = []; 
419 self.keywords = []; 
420 
 
421 var style = document.createElement('div').style; 
422 
 
423 function supported(value, property) { 
424 	style[property] = ''; 
425 	style[property] = value; 
426 
 
427 	return !!style[property]; 
428 } 
429 
 
430 for (var func in functions) { 
431 	var test = functions[func], 
432 		property = test.property, 
433 		value = func + '(' + test.params + ')'; 
434 
 
435 	if (!supported(value, property) 
436 	  && supported(self.prefix + value, property)) { 
437 		// It's supported, but with a prefix 
438 		self.functions.push(func); 
439 	} 
440 } 
441 
 
442 for (var keyword in keywords) { 
443 	var property = keywords[keyword]; 
444 
 
445 	if (!supported(keyword, property) 
446 	  && supported(self.prefix + keyword, property)) { 
447 		// It's supported, but with a prefix 
448 		self.keywords.push(keyword); 
449 	} 
450 } 
451 
 
452 })(); 
453 
 
454 /************************************** 
455  * Selectors and @-rules 
456  **************************************/ 
457 (function() { 
458 
 
459 var 
460 selectors = { 
461 	':any-link': null, 
462 	'::backdrop': null, 
463 	':fullscreen': null, 
464 	':full-screen': ':fullscreen', 
465 	//sigh 
466 	'::placeholder': null, 
467 	':placeholder': '::placeholder', 
468 	'::input-placeholder': '::placeholder', 
469 	':input-placeholder': '::placeholder', 
470 	':read-only': null, 
471 	':read-write': null, 
472 	'::selection': null 
473 }, 
474 
 
475 atrules = { 
476 	'keyframes': 'name', 
477 	'viewport': null, 
478 	'document': 'regexp(".")' 
479 }; 
480 
 
481 self.selectors = []; 
482 self.selectorMap = {}; 
483 self.atrules = []; 
484 
 
485 var style = root.appendChild(document.createElement('style')); 
486 
 
487 function supported(selector) { 
488 	style.textContent = selector + '{}';  // Safari 4 has issues with style.innerHTML 
489 
 
490 	return !!style.sheet.cssRules.length; 
491 } 
492 
 
493 for(var selector in selectors) { 
494 	var standard = selectors[selector] || selector 
495 	var prefixed = selector.replace(/::?/, function($0) { return $0 + self.prefix }) 
496 	if(!supported(standard) && supported(prefixed)) { 
497 		self.selectors.push(standard); 
498 		self.selectorMap[standard] = prefixed; 
499 	} 
500 } 
501 
 
502 for(var atrule in atrules) { 
503 	var test = atrule + ' ' + (atrules[atrule] || ''); 
504 
 
505 	if(!supported('@' + test) && supported('@' + self.prefix + test)) { 
506 		self.atrules.push(atrule); 
507 	} 
508 } 
509 
 
510 root.removeChild(style); 
511 
 
512 })(); 
513 
 
514 // Properties that accept properties as their value 
515 self.valueProperties = [ 
516 	'transition', 
517 	'transition-property', 
518 	'will-change' 
519 ] 
520 
 
521 // Add class for current prefix 
522 root.className += ' ' + self.prefix; 
523 
 
524 StyleFix.register(self.prefixCSS); 
525 
 
526 
 
527 })(document.documentElement); 
