import { Liquid } from '../../../src/liquid'

describe('LiquidOptions#*outputEscape*', function () {
  it('when outputEscape is not set', async function () {
    const engine = new Liquid()
    const html = await engine.parseAndRender('{{"<"}}')
    expect(html).toBe('<')
  })

  it('should escape when outputEscape="escape"', async function () {
    const engine = new Liquid({
      outputEscape: 'escape'
    })
    const html = await engine.parseAndRender('{{"<"}}')
    expect(html).toBe('&lt;')
  })

  it('should json stringify when outputEscape="json"', async function () {
    const engine = new Liquid({
      outputEscape: 'json'
    })
    const html = await engine.parseAndRender('{{"<"}}')
    expect(html).toBe('"<"')
  })

  it('should support outputEscape=Function', async function () {
    const engine = new Liquid({
      outputEscape: (v: any) => `{${v}}`
    })
    const html = await engine.parseAndRender('{{"<"}}')
    expect(html).toBe('{<}')
  })

  it('should skip escape for output with filter "| raw"', async function () {
    const engine = new Liquid({
      outputEscape: 'escape'
    })
    const html = await engine.parseAndRender('{{"<" | raw}}')
    expect(html).toBe('<')
  })

  describe('safe strings', function () {
    const scope = { s: '<x>' }
    let engine: Liquid
    beforeEach(function () {
      engine = new Liquid({ outputEscape: 'escape' })
    })

    it('should not escape captured content twice', async function () {
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should escape captured content only once when rendered multiple times', async function () {
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }} and {{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b>&lt;x&gt;</b> and <b>&lt;x&gt;</b>')
    })

    it('should treat filtered capture result as plain string and escape once', async function () {
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c | upcase }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('&lt;B&gt;&amp;LT;X&amp;GT;&lt;/B&gt;')
    })

    it('should escape external data assigned to variables', async function () {
      const src = '{% assign a = s %}{{ a }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('&lt;x&gt;')
    })

    it('should keep captured content safe when assigned to another variable', async function () {
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{% assign a = c %}{{ a }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should support nested capture', async function () {
      const src = '{% capture a %}<i>{% endcapture %}{% capture b %}{{ a }}{{ s }}{% endcapture %}{{ b }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<i>&lt;x&gt;')
    })

    it('should keep captured content safe when passed to partials', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { partial: '[{{ v }}]' }
      })
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{% render "partial", v: c %}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('[<b>&lt;x&gt;</b>]')
    })

    it('should keep "| raw" output as-is inside capture', async function () {
      const src = '{% capture c %}{{ s | raw }}{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<x>')
    })

    it('should keep raw tag content as-is inside capture', async function () {
      const src = '{% capture c %}{% raw %}<i>{{ s }}</i>{% endraw %}{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<i>{{ s }}</i>')
    })

    it('should support string properties of captured content', async function () {
      const src = '{% capture c %}abc{% endcapture %}{{ c.size }}|{{ c.length }}|{{ c | size }}'
      const html = await engine.parseAndRender(src)
      expect(html).toBe('3|3|3')
    })

    it('should support default filter on captured content', async function () {
      const src = '{% capture c %}{% endcapture %}{{ c | default: "fallback" }}'
      const html = await engine.parseAndRender(src)
      expect(html).toBe('fallback')
    })

    it('should support captured content in conditions', async function () {
      const src = '{% capture c %}abc{% endcapture %}' +
        '{% if c == "abc" %}eq{% endif %}' +
        '{% if c contains "b" %}|contains{% endif %}' +
        '{% if c %}|truthy{% endif %}'
      const html = await engine.parseAndRender(src)
      expect(html).toBe('eq|contains|truthy')
    })

    it('should not escape layout blocks twice', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { parent: '<html>{% block body %}default{% endblock %}</html>' }
      })
      const src = '{% layout "parent" %}{% block body %}<b>{{ s }}</b>{% endblock %}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<html><b>&lt;x&gt;</b></html>')
    })

    it('should support dynamic layout filename', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { 'lay-a': '<html>{% block body %}{% endblock %}</html>' }
      })
      const src = '{% layout "lay-{{ name }}" %}{% block body %}<b>{{ s }}</b>{% endblock %}'
      const html = await engine.parseAndRender(src, { ...scope, name: 'a' })
      expect(html).toBe('<html><b>&lt;x&gt;</b></html>')
    })

    it('should not escape layout anonymous content twice', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { parent: '<html>{% block %}{% endblock %}</html>' }
      })
      const src = '{% layout "parent" %}<b>{{ s }}</b>'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<html><b>&lt;x&gt;</b></html>')
    })

    it('should not escape block.super twice', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { parent: '{% block body %}<i>{{ s }}</i>{% endblock %}' }
      })
      const src = '{% layout "parent" %}{% block body %}{{ block.super }}+{% endblock %}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<i>&lt;x&gt;</i>+')
    })

    it('should not escape included partials twice when captured', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { partial: '<b>{{ s }}</b>' }
      })
      const src = '{% capture c %}{% include "partial" %}{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should not escape rendered partials twice when captured', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { partial: '<b>{{ s }}</b>' }
      })
      const src = '{% capture c %}{% render "partial", s: s %}{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should escape {% echo %} like {{ }}', async function () {
      const html = await engine.parseAndRender('{% echo s %}', scope)
      expect(html).toBe('&lt;x&gt;')
    })

    it('should apply filters before {% echo %} output', async function () {
      const html = await engine.parseAndRender('{% echo s | upcase %}', scope)
      expect(html).toBe('&lt;X&gt;')
    })

    it('should skip escape for {% echo %} with filter "| raw"', async function () {
      const html = await engine.parseAndRender('{% echo s | raw %}', scope)
      expect(html).toBe('<x>')
    })

    it('should not escape {% echo %} inside capture twice', async function () {
      const src = '{% capture c %}{% echo s %}{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('&lt;x&gt;')
    })

    it('should support custom outputEscape function', async function () {
      const engine = new Liquid({ outputEscape: (v: any) => `{${v}}` })
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b>{<x>}</b>')
    })

    it('should support outputEscape="json"', async function () {
      const engine = new Liquid({ outputEscape: 'json' })
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b>"<x>"</b>')
    })

    it('should render the same in sync mode', function () {
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}'
      const html = engine.parseAndRenderSync(src, scope)
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should render the same to node stream', async function () {
      const stream = engine.renderToNodeStream(
        engine.parse('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}'),
        scope
      )
      let html = ''
      await new Promise<void>((resolve, reject) => {
        stream.on('data', chunk => (html += chunk))
        stream.on('end', resolve)
        stream.on('error', reject)
      })
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should keep keepOutputType behavior', async function () {
      const engine = new Liquid({ keepOutputType: true, outputEscape: 'escape' })
      expect(await engine.parseAndRender('{{ 42 }}')).toBe('42')
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}', scope)
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should escape custom tag output in capture as before', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      engine.registerTag('custom', {
        parse () {},
        render (ctx, emitter) {
          emitter.write('<u>custom</u>')
        }
      })
      const src = '{% capture c %}<b>{% custom %}</b>{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src)
      expect(html).toBe('&lt;b&gt;&lt;u&gt;custom&lt;/u&gt;&lt;/b&gt;')
    })

    it('should not change behavior when outputEscape is not set', async function () {
      const engine = new Liquid()
      const src = '{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}'
      const html = await engine.parseAndRender(src, scope)
      expect(html).toBe('<b><x></b>')
    })
  })
})
