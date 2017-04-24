// Filename: resolvewithplus.spec.js  
// Timestamp: 2017.04.23-23:31:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

var resolvewithplus = require('../src/resolvewithplus'),
    resolvewith = resolvewithplus,
    path = require('path');
//
// should pass resolve with tests as well
//



describe("resolvewith", function () {
  it("should return a core module reference as require.resolve id", function () {
    expect(
      resolvewith('path')
    ).toBe(
      require.resolve('path')
    );    
  });
  
  it("should return a full path when given the relative path to an index file", function () {
    var fullpath = path.resolve('./spec/testfiles/');

    expect(
      resolvewith('./path/to/indexfile', fullpath)
    ).toBe(
      path.resolve('./spec/testfiles/path/to/indexfile/index.js')
    );

    expect(
      resolvewith('../testfiles/path/to/indexfile', fullpath)
    ).toBe(
      path.resolve('./spec/testfiles/path/to/indexfile/index.js')
    );

    expect(
      resolvewith('./path/to/indexfile/index', fullpath)
    ).toBe(
      path.resolve('./spec/testfiles/path/to/indexfile/index.js')
    );

    expect(
      resolvewith('./path/to/indexfile/index.js', fullpath)
    ).toBe(
      path.resolve('./spec/testfiles/path/to/indexfile/index.js')
    );        

  });

  it("should use the process path as a default 'with' path (second parameter)", function () {
    expect(
      resolvewith('./path/to/indexfile')
    ).toBe(
      null
    );

    expect(
      resolvewith('./spec/testfiles/path/to/indexfile')      
    ).toBe(
      path.resolve('./spec/testfiles/path/to/indexfile/index.js')      
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
    var fullpath = path.resolve('./spec/testfiles/');

    expect(
      resolvewith('optfn', fullpath)
    ).toBe(
      path.resolve('./node_modules/optfn/optfn.js')
    );
  });

  it("should return a null when given the id to a module inaccessible from withpath", function () {
    var fullpath = path.resolve('./spec/testfiles/');
    
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
      resolvewith('../src/resolvewithplus', path.resolve('../resolvewithplus/spec/'))
    );

    expect(
      require.resolve('./testfiles/testscript.js')
    ).toBe(
      resolvewith('./testfiles/testscript.js', path.resolve('../resolvewithplus/spec/'))
    );

    expect(
      require.resolve('path')
    ).toBe(
      resolvewith('path', path.resolve('../resolvewithplus/spec/'))    
    );    
  });
});
