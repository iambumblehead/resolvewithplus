// Filename: resolvewithplus.spec.js  
// Timestamp: 2015.12.15-07:19:46 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

var resolvewithplus = require('../src/resolvewithplus'),
    path = require('path');

describe("resolvewithplus", function () {

  it("should return the path to a bower module file", function () {
    expect(
      resolvewithplus('bowercomponent', './test/resolvewithplus.spec.js')
    ).toBe(
      path.resolve('./test/bower_components/bowercomponent/src/bower-component.js')
    );    
  });

  it("should return the path to a bower module file", function () {
    expect(
      resolvewithplus('bowercomponentbrowser', './test/resolvewithplus.spec.js')
    ).toBe(
      path.resolve('./test/bower_components/bowercomponentbrowser/src/bower-component.js')
    );    
  });  

  it("should return the path to a bower module's browser file", function () {
    expect(
      resolvewithplus('bowercomponentbrowser', './test/resolvewithplus.spec.js', { browser : true })
    ).toBe(
      path.resolve('./test/bower_components/bowercomponentbrowser/src/bower-component-browser.js')
    );    
  });  
});


//
// should pass resolve with tests as well
//

var resolvewith = resolvewithplus;

describe("resolvewith", function () {
  it("should return a core module reference as require.resolve id", function () {
    expect(
      resolvewith('path')
    ).toBe(
      require.resolve('path')
    );    
  });
  
  it("should return a full path when given the relative path to an index file", function () {
    var fullpath = path.resolve('./test/testfiles/');

    expect(
      resolvewith('./path/to/indexfile', fullpath)
    ).toBe(
      path.resolve('./test/testfiles/path/to/indexfile/index.js')
    );

    expect(
      resolvewith('../testfiles/path/to/indexfile', fullpath)
    ).toBe(
      path.resolve('./test/testfiles/path/to/indexfile/index.js')
    );

    expect(
      resolvewith('./path/to/indexfile/index', fullpath)
    ).toBe(
      path.resolve('./test/testfiles/path/to/indexfile/index.js')
    );

    expect(
      resolvewith('./path/to/indexfile/index.js', fullpath)
    ).toBe(
      path.resolve('./test/testfiles/path/to/indexfile/index.js')
    );        

  });

  it("should use the process path as a default 'with' path (second parameter)", function () {
    expect(
      resolvewith('./path/to/indexfile')
    ).toBe(
      null
    );

    expect(
      resolvewith('./test/testfiles/path/to/indexfile')      
    ).toBe(
      path.resolve('./test/testfiles/path/to/indexfile/index.js')      
    );        
  });

  it("should return null if a path does not exist", function () {
    expect(
      resolvewith('./path/does/not/exist')
    ).toBe(
      null
    );
  });

  it("should return a full path when given the id to a module", function () {
    var fullpath = path.resolve('./test/testfiles/');

    expect(
      resolvewith('optfn', fullpath)
    ).toBe(
      path.resolve('./node_modules/optfn/optfn.js')
    );
  });

  it("should return a null when given the id to a module inaccessible from withpath", function () {
    var fullpath = path.resolve('./test/testfiles/');
    
    expect(
      resolvewith('notamodulename', path.join(fullpath + '/path/to/indexfile'))
    ).toBe(
      null
    );        
  });

  it("should follow the behaviour of require.resolve", function () {
    expect(
      require.resolve('../src/resolvewithplus')
    ).toBe(
      resolvewith('../src/resolvewithplus', path.resolve('../resolvewithplus/test/'))
    );

    expect(
      require.resolve('./testfiles/testscript.js')
    ).toBe(
      resolvewith('./testfiles/testscript.js', path.resolve('../resolvewithplus/test/'))
    );

    expect(
      require.resolve('path')
    ).toBe(
      resolvewith('path', path.resolve('../resolvewithplus/test/'))    
    );    
  });
});

describe("resolvewith.getasdirname", function () {
  it("should return a relative path as a fullpath", function () {
    expect( /^\/.*relpath$/.test(resolvewith.getasdirname('./relpath')) ).toBe(true);
  });
});


