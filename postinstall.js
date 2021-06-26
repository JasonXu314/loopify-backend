const fs = require('fs');

try {
	const ytdlOriginal = fs.readFileSync('./node_modules/ytdl-core/lib/info.js');
	fs.writeFileSync(
		'./node_modules/ytdl-core/lib/info.js',
		ytdlOriginal.toString().replace(
			`
	  url.searchParams.set('video_id', id);
	  url.searchParams.set('eurl', VIDEO_EURL + id);
	`,
			`
	  url.searchParams.set('video_id', id);
	  url.searchParams.set('c', 'TVHTML5');
	  url.searchParams.set('cver', '7.20190319');
	  url.searchParams.set('eurl', VIDEO_EURL + id);
	`
		)
	);

	const expressOriginal = fs.readFileSync('./node_modules/@types/express/node_modules/@types/express-serve-static-core/index.d.ts');
	fs.writeFileSync(
		'./node_modules/@types/express/node_modules/@types/express-serve-static-core/index.d.ts',
		expressOriginal.toString().replace('req?: Request;', 'req: Request;')
	);
} catch (err) {
	console.log(fs.readdirSync('.'));
}
