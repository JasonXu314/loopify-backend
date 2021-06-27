const fs = require('fs');

try {
	const expressOriginal = fs.readFileSync('./node_modules/@types/express/node_modules/@types/express-serve-static-core/index.d.ts');

	if (expressOriginal.includes('req?: Request;')) {
		fs.writeFileSync(
			'./node_modules/@types/express/node_modules/@types/express-serve-static-core/index.d.ts',
			expressOriginal.toString().replace('req?: Request;', 'req: Request;')
		);
	}
} catch (err) {
	console.log(fs.readdirSync('.'));
}
