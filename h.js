const foo = () => console.log('First');
const bar = () => setTimeout(() => console.log('Second'),2000);
const baz = () => console.log('Third');

bar();
baz();
foo();