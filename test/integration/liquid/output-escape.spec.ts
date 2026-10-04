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

  describe('safe template output', function () {
    it('should not escape captured content again', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}', { s: '<x>' })
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should not escape nested captured content', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{% capture d %}{{ c }}{% endcapture %}{{ d }}', { s: '<x>' })
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should escape captured content processed by filters', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c | upcase }}', { s: '<x>' })
      expect(html).toBe('&lt;B&gt;&amp;LT;X&amp;GT;&lt;/B&gt;')
    })

    it('should keep captured content safe through assign', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{% assign x = c %}{{ x }}', { s: '<x>' })
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should escape external data assigned to variables', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% assign x = s %}{{ x }}', { s: '<x>' })
      expect(html).toBe('&lt;x&gt;')
    })

    it('should support comparison on captured content', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const blank = await engine.parseAndRender('{% capture c %}{% endcapture %}{% if c == blank %}blank{% endif %}')
      expect(blank).toBe('blank')
      const empty = await engine.parseAndRender('{% capture c %}{% endcapture %}{% if c == empty %}empty{% endif %}')
      expect(empty).toBe('empty')
      const eq = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{% if c == "<b>&lt;x&gt;</b>" %}eq{% endif %}', { s: '<x>' })
      expect(eq).toBe('eq')
      const contains = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{% if c contains "&lt;" %}yes{% endif %}', { s: '<x>' })
      expect(contains).toBe('yes')
    })

    it('should support property access on captured content', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c.size }}', { s: '<x>' })
      expect(html).toBe('16')
    })

    it('should treat filter results on captured content as plain strings', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c | json }}', { s: '<x>' })
      expect(html).toBe('&#34;&lt;b&gt;&amp;lt;x&amp;gt;&lt;/b&gt;&#34;')
    })

    it('should keep explicit escape filter behavior on captured content', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c | escape }}', { s: '<x>' })
      expect(html).toBe('&amp;lt;b&amp;gt;&amp;amp;lt;x&amp;amp;gt;&amp;lt;/b&amp;gt;')
    })

    it('should output captured content as-is with raw filter', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c | raw }}', { s: '<x>' })
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should not escape block.super again', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { layout: '<html>{% block content %}<sup>{{ s }}</sup>{% endblock %}</html>' }
      })
      const html = await engine.parseAndRender('{% layout "layout" %}{% block content %}{{ block.super }}<b>{{ s }}</b>{% endblock %}', { s: '<x>' })
      expect(html).toBe('<html><sup>&lt;x&gt;</sup><b>&lt;x&gt;</b></html>')
    })

    it('should render layout blocks like inline content', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { layout: '<html>{% block content %}default{% endblock %}</html>' }
      })
      const html = await engine.parseAndRender('{% layout "layout" %}{% block content %}<b>{{ s }}</b>{% endblock %}', { s: '<x>' })
      expect(html).toBe('<html><b>&lt;x&gt;</b></html>')
    })

    it('should escape echo output like {{ }}', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% echo s %}', { s: '<x>' })
      expect(html).toBe('&lt;x&gt;')
    })

    it('should skip escape for echo with filter "| raw"', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% echo s | raw %}', { s: '<x>' })
      expect(html).toBe('<x>')
    })

    it('should not escape captured content in echo', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{% echo c %}', { s: '<x>' })
      expect(html).toBe('<b>&lt;x&gt;</b>')
    })

    it('should escape echo in liquid tag', async function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = await engine.parseAndRender('{% liquid echo s %}', { s: '<x>' })
      expect(html).toBe('&lt;x&gt;')
    })

    it('should support custom outputEscape function with capture', async function () {
      const engine = new Liquid({
        outputEscape: (v: any) => `{${v}}`
      })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}', { s: '<x>' })
      expect(html).toBe('<b>{<x>}</b>')
    })

    it('should support outputEscape="json" with capture', async function () {
      const engine = new Liquid({ outputEscape: 'json' })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}', { s: '<x>' })
      expect(html).toBe('<b>"<x>"</b>')
    })

    it('should pass captured content to include without escaping again', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { item: '[{{ item }}]' }
      })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{% include "item" with c %}', { s: '<x>' })
      expect(html).toBe('[<b>&lt;x&gt;</b>]')
    })

    it('should pass captured content to render without escaping again', async function () {
      const engine = new Liquid({
        outputEscape: 'escape',
        templates: { item: '[{{ v }}]' }
      })
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{% render "item", v: c %}', { s: '<x>' })
      expect(html).toBe('[<b>&lt;x&gt;</b>]')
    })

    it('should render consistently in sync mode', function () {
      const engine = new Liquid({ outputEscape: 'escape' })
      const html = engine.parseAndRenderSync('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}{% echo s %}', { s: '<x>' })
      expect(html).toBe('<b>&lt;x&gt;</b>&lt;x&gt;')
    })

    it('should render consistently to node stream', function (done) {
      const engine = new Liquid({ outputEscape: 'escape' })
      const tpl = engine.parse('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}{% echo s %}')
      const stream = engine.renderToNodeStream(tpl, { s: '<x>' })
      let html = ''
      stream.on('data', (data: string) => { html += data })
      stream.on('end', () => {
        try {
          expect(html).toBe('<b>&lt;x&gt;</b>&lt;x&gt;')
          done()
        } catch (err) {
          done(err)
        }
      })
    })

    it('should not change capture/echo behavior when outputEscape is not set', async function () {
      const engine = new Liquid()
      const html = await engine.parseAndRender('{% capture c %}<b>{{ s }}</b>{% endcapture %}{{ c }}{% echo s %}', { s: '<x>' })
      expect(html).toBe('<b><x></b><x>')
    })

    it('should not change block.super behavior when outputEscape is not set', async function () {
      const engine = new Liquid({
        templates: { layout: '<html>{% block content %}<sup>{{ s }}</sup>{% endblock %}</html>' }
      })
      const html = await engine.parseAndRender('{% layout "layout" %}{% block content %}{{ block.super }}<b>{{ s }}</b>{% endblock %}', { s: '<x>' })
      expect(html).toBe('<html><sup><x></sup><b><x></b></html>')
    })
  })
})
